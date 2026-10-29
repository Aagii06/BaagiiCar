package mn.cardealer.sms_gateway_app

import android.content.Context
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

// Service болон UI хоёрын дундын төлөв (нэг процесс дотор). Тохиргоо SharedPreferences-д хадгалагдана.
object GatewayState {
    private const val PREFS = "gateway"

    @Volatile var running = false
    @Volatile var connected = false
    @Volatile var lastError: String? = null
    @Volatile var sentCount = 0
    @Volatile var failedCount = 0

    private val log = ArrayDeque<String>()
    private val timeFormat = SimpleDateFormat("MM-dd HH:mm:ss", Locale.US)

    @Synchronized
    fun addLog(line: String) {
        log.addFirst("${timeFormat.format(Date())}  $line")
        while (log.size > 100) log.removeLast()
    }

    @Synchronized
    fun logLines(): List<String> = log.toList()

    fun prefs(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    fun serverUrl(context: Context) = prefs(context).getString("server_url", "") ?: ""
    fun token(context: Context) = prefs(context).getString("token", "") ?: ""

    // Утас дахин асахад автоматаар эхлэх эсэх (сүүлд асаалттай байсан бол)
    fun enabled(context: Context) = prefs(context).getBoolean("enabled", false)

    fun save(context: Context, serverUrl: String, token: String) {
        prefs(context).edit().putString("server_url", serverUrl.trim().trimEnd('/')).putString("token", token.trim()).apply()
    }

    fun setEnabled(context: Context, value: Boolean) {
        prefs(context).edit().putBoolean("enabled", value).apply()
    }
}
