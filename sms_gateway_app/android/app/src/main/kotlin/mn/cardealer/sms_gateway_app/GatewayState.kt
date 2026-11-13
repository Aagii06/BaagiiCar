package mn.cardealer.sms_gateway_app

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.ConcurrentHashMap

// Нэг backend: хаяг + SMS_GATEWAY_TOKEN
data class GatewayServer(val url: String, val token: String) {
    // Логт харуулах богино нэр (host)
    val label: String get() = runCatching { URL(url).host }.getOrNull() ?: url
}

// Service болон UI хоёрын дундын төлөв (нэг процесс дотор). Тохиргоо SharedPreferences-д хадгалагдана.
object GatewayState {
    private const val PREFS = "gateway"

    @Volatile var running = false
    @Volatile var sentCount = 0
    @Volatile var failedCount = 0

    // Сервер бүрийн холболтын төлөв (url -> ...)
    val connected = ConcurrentHashMap<String, Boolean>()
    val lastError = ConcurrentHashMap<String, String>()

    private val log = ArrayDeque<String>()
    private val timeFormat = SimpleDateFormat("MM-dd HH:mm:ss", Locale.US)

    @Synchronized
    fun addLog(line: String) {
        log.addFirst("${timeFormat.format(Date())}  $line")
        while (log.size > 100) log.removeLast()
    }

    @Synchronized
    fun logLines(): List<String> = log.toList()

    @Synchronized
    fun incrementSent() { sentCount++ }

    @Synchronized
    fun incrementFailed() { failedCount++ }

    fun prefs(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    fun servers(context: Context): List<GatewayServer> {
        val prefs = prefs(context)
        val json = prefs.getString("servers", null)
        if (json != null) {
            val array = JSONArray(json)
            return (0 until array.length()).map {
                val item = array.getJSONObject(it)
                GatewayServer(item.optString("url"), item.optString("token"))
            }
        }
        // Хуучин хувилбарын нэг серверийн тохиргоо
        val url = prefs.getString("server_url", "") ?: ""
        return if (url.isEmpty()) emptyList() else listOf(GatewayServer(url, prefs.getString("token", "") ?: ""))
    }

    fun save(context: Context, servers: List<GatewayServer>) {
        val array = JSONArray()
        servers
            .map { GatewayServer(it.url.trim().trimEnd('/'), it.token.trim()) }
            .filter { it.url.isNotEmpty() }
            .distinctBy { it.url }
            .forEach { array.put(JSONObject().put("url", it.url).put("token", it.token)) }
        prefs(context).edit().putString("servers", array.toString()).remove("server_url").remove("token").apply()
    }

    // Утас дахин асахад автоматаар эхлэх эсэх (сүүлд асаалттай байсан бол)
    fun enabled(context: Context) = prefs(context).getBoolean("enabled", false)

    fun setEnabled(context: Context, value: Boolean) {
        prefs(context).edit().putBoolean("enabled", value).apply()
    }
}
