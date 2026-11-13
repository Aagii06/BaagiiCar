package mn.cardealer.sms_gateway_app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

// Ар талд ажиллах foreground service:
//   GET  <server>/api/sms-gateway/pending?wait=25  (long-poll - шинэ SMS ирэнгүүт хариу ирнэ)
//   SIM-ээр илгээнэ
//   POST <server>/api/sms-gateway/:id/status  { status: "sent" | "failed", error }
class GatewayService : Service() {
    companion object {
        private const val CHANNEL_ID = "gateway"
        private const val NOTIFICATION_ID = 1
        private const val WAIT_SECONDS = 25

        fun start(context: Context) {
            val intent = Intent(context, GatewayService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) context.startForegroundService(intent)
            else context.startService(intent)
        }

        fun stop(context: Context) {
            context.stopService(Intent(context, GatewayService::class.java))
        }
    }

    private val workers = mutableListOf<Thread>()
    private var wakeLock: PowerManager.WakeLock? = null

    // Зогсоогоод шууд асаахад хуучин (long-poll дээр хүлээж буй) thread-үүд үргэлжлэхгүйн тулд
    @Volatile private var generation = 0

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startInForeground("Холбогдож байна...")
        if (workers.none { it.isAlive }) {
            val servers = GatewayState.servers(this)
            if (servers.isEmpty()) {
                GatewayState.addLog("Сервер тохируулаагүй байна")
                stopSelf()
                return START_NOT_STICKY
            }
            if (wakeLock?.isHeld != true) {
                wakeLock = (getSystemService(POWER_SERVICE) as PowerManager)
                    .newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "sms_gateway:loop")
                    .apply { acquire() }
            }
            GatewayState.running = true
            GatewayState.connected.clear()
            GatewayState.lastError.clear()
            GatewayState.addLog("Gateway асаалаа (${servers.size} сервер)")
            val gen = ++generation
            workers.clear()
            servers.forEach { server ->
                workers += Thread({ loop(server, gen) }, "sms-gateway-${server.label}").apply { start() }
            }
        }
        return START_STICKY
    }

    override fun onDestroy() {
        generation++
        GatewayState.running = false
        GatewayState.connected.clear()
        workers.forEach { it.interrupt() }
        workers.clear()
        wakeLock?.takeIf { it.isHeld }?.release()
        GatewayState.addLog("Gateway унтраалаа")
        super.onDestroy()
    }

    private fun active(gen: Int) = GatewayState.running && gen == generation && !Thread.currentThread().isInterrupted

    private fun statusText(): String {
        val total = GatewayState.servers(this).size
        val online = GatewayState.connected.count { it.value }
        return "Холбогдсон $online/$total · илгээсэн ${GatewayState.sentCount}"
    }

    private fun loop(server: GatewayServer, gen: Int) {
        val name = server.label
        var backoff = 2_000L
        while (active(gen)) {
            try {
                val body = request("GET", "${server.url}/api/sms-gateway/pending?wait=$WAIT_SECONDS", server.token, null)
                if (!active(gen)) break
                val items = JSONObject(body).optJSONArray("data")

                if (GatewayState.connected[server.url] != true) {
                    GatewayState.connected[server.url] = true
                    GatewayState.lastError.remove(server.url)
                    GatewayState.addLog("[$name] Сервертэй холбогдлоо")
                    updateNotification(statusText())
                }
                backoff = 2_000L

                for (i in 0 until (items?.length() ?: 0)) {
                    val item = items!!.getJSONObject(i)
                    val id = item.getInt("id")
                    val phone = item.getString("phonenumber")
                    // SIM нэг тул серверүүдийн мессежийг ээлжлэн илгээнэ
                    val error = synchronized(SmsSender) { SmsSender.send(this, phone, item.getString("text")) }

                    if (error == null) {
                        GatewayState.incrementSent()
                        GatewayState.addLog("[$name] ✓ $phone руу илгээлээ (#$id)")
                    } else {
                        GatewayState.incrementFailed()
                        GatewayState.addLog("[$name] ✗ $phone: $error (#$id)")
                    }
                    report(server, id, error)
                    updateNotification(statusText())
                }
            } catch (e: InterruptedException) {
                break
            } catch (e: Exception) {
                if (!active(gen)) break
                val message = e.message ?: e.javaClass.simpleName
                if (GatewayState.connected[server.url] == true || GatewayState.lastError[server.url] != message)
                    GatewayState.addLog("[$name] Холболтын алдаа: $message")
                GatewayState.connected[server.url] = false
                GatewayState.lastError[server.url] = message
                updateNotification(statusText())
                try {
                    Thread.sleep(backoff)
                } catch (_: InterruptedException) {
                    break
                }
                backoff = (backoff * 2).coerceAtMost(30_000L)
            }
        }
    }

    // Үр дүнг мэдээлэхэд алдаа гарвал хэдэн удаа дахин оролдоно (мэдээлээгүй бол сервер 2 минутын дараа дахин өгнө)
    private fun report(server: GatewayServer, id: Int, error: String?) {
        val payload = JSONObject().put("status", if (error == null) "sent" else "failed").put("error", error ?: "")
        repeat(3) { attempt ->
            try {
                request("POST", "${server.url}/api/sms-gateway/$id/status", server.token, payload.toString())
                return
            } catch (e: Exception) {
                if (attempt == 2) GatewayState.addLog("[${server.label}] Үр дүн мэдээлж чадсангүй #$id: ${e.message}")
                else Thread.sleep(1_000)
            }
        }
    }

    private fun request(method: String, url: String, token: String, json: String?): String {
        val connection = URL(url).openConnection() as HttpURLConnection
        try {
            connection.requestMethod = method
            connection.connectTimeout = 15_000
            connection.readTimeout = (WAIT_SECONDS + 15) * 1000
            connection.setRequestProperty("Authorization", "Bearer $token")
            connection.setRequestProperty("Accept", "application/json")
            if (json != null) {
                connection.doOutput = true
                connection.setRequestProperty("Content-Type", "application/json")
                connection.outputStream.use { it.write(json.toByteArray()) }
            }
            val code = connection.responseCode
            if (code == 401) throw IllegalStateException("Token буруу (401)")
            if (code !in 200..299) throw IllegalStateException("HTTP $code")
            return connection.inputStream.bufferedReader().use { it.readText() }
        } finally {
            connection.disconnect()
        }
    }

    private fun startInForeground(text: String) {
        val manager = getSystemService(NotificationManager::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
            manager.createNotificationChannel(NotificationChannel(CHANNEL_ID, "SMS gateway", NotificationManager.IMPORTANCE_LOW))
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE)
            startForeground(NOTIFICATION_ID, buildNotification(text), ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
        else startForeground(NOTIFICATION_ID, buildNotification(text))
    }

    private fun updateNotification(text: String) {
        getSystemService(NotificationManager::class.java).notify(NOTIFICATION_ID, buildNotification(text))
    }

    private fun buildNotification(text: String): Notification {
        val open = PendingIntent.getActivity(
            this, 0, Intent(this, MainActivity::class.java), PendingIntent.FLAG_IMMUTABLE,
        )
        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) Notification.Builder(this, CHANNEL_ID)
        else @Suppress("DEPRECATION") Notification.Builder(this)
        return builder
            .setContentTitle("Cardealer SMS gateway")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.stat_notify_chat)
            .setContentIntent(open)
            .setOngoing(true)
            .build()
    }
}
