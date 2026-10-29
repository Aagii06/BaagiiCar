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

    private var worker: Thread? = null
    private var wakeLock: PowerManager.WakeLock? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startInForeground("Холбогдож байна...")
        if (worker?.isAlive != true) {
            wakeLock = (getSystemService(POWER_SERVICE) as PowerManager)
                .newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "sms_gateway:loop")
                .apply { acquire() }
            GatewayState.running = true
            GatewayState.addLog("Gateway асаалаа")
            worker = Thread(::loop, "sms-gateway").apply { start() }
        }
        return START_STICKY
    }

    override fun onDestroy() {
        GatewayState.running = false
        GatewayState.connected = false
        worker?.interrupt()
        worker = null
        wakeLock?.takeIf { it.isHeld }?.release()
        GatewayState.addLog("Gateway унтраалаа")
        super.onDestroy()
    }

    private fun loop() {
        var backoff = 2_000L
        while (GatewayState.running && !Thread.currentThread().isInterrupted) {
            try {
                val server = GatewayState.serverUrl(this)
                val token = GatewayState.token(this)
                val body = request("GET", "$server/api/sms-gateway/pending?wait=$WAIT_SECONDS", token, null)
                val items = JSONObject(body).optJSONArray("data")

                if (!GatewayState.connected) {
                    GatewayState.connected = true
                    GatewayState.lastError = null
                    GatewayState.addLog("Сервертэй холбогдлоо")
                    updateNotification("Ажиллаж байна · илгээсэн ${GatewayState.sentCount}")
                }
                backoff = 2_000L

                for (i in 0 until (items?.length() ?: 0)) {
                    val item = items!!.getJSONObject(i)
                    val id = item.getInt("id")
                    val phone = item.getString("phonenumber")
                    val error = SmsSender.send(this, phone, item.getString("text"))

                    if (error == null) {
                        GatewayState.sentCount++
                        GatewayState.addLog("✓ $phone руу илгээлээ (#$id)")
                    } else {
                        GatewayState.failedCount++
                        GatewayState.addLog("✗ $phone: $error (#$id)")
                    }
                    report(server, token, id, error)
                    updateNotification("Ажиллаж байна · илгээсэн ${GatewayState.sentCount}")
                }
            } catch (e: InterruptedException) {
                break
            } catch (e: Exception) {
                val message = e.message ?: e.javaClass.simpleName
                if (GatewayState.connected || GatewayState.lastError != message) GatewayState.addLog("Холболтын алдаа: $message")
                GatewayState.connected = false
                GatewayState.lastError = message
                updateNotification("Холболт тасарсан, дахин оролдож байна...")
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
    private fun report(server: String, token: String, id: Int, error: String?) {
        val payload = JSONObject().put("status", if (error == null) "sent" else "failed").put("error", error ?: "")
        repeat(3) { attempt ->
            try {
                request("POST", "$server/api/sms-gateway/$id/status", token, payload.toString())
                return
            } catch (e: Exception) {
                if (attempt == 2) GatewayState.addLog("Үр дүн мэдээлж чадсангүй #$id: ${e.message}")
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
