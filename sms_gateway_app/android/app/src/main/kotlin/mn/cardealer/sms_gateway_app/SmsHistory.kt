package mn.cardealer.sms_gateway_app

import android.content.Context
import org.json.JSONObject
import java.io.File

// Илгээсэн SMS-ийн түүх (утсан дээр, сүүлийн MAX_ENTRIES ширхэг). Мөр бүр нэг JSON.
object SmsHistory {
    private const val FILE = "sms_history.jsonl"
    private const val MAX_ENTRIES = 1000

    private fun file(context: Context) = File(context.filesDir, FILE)

    @Synchronized
    fun add(context: Context, server: String, phonenumber: String, text: String, error: String?) {
        val entry = JSONObject()
            .put("time", System.currentTimeMillis())
            .put("server", server)
            .put("phonenumber", phonenumber)
            .put("text", text)
            .put("status", if (error == null) "sent" else "failed")
            .put("error", error ?: "")
        try {
            val file = file(context)
            file.appendText(entry.toString() + "\n")
            // Хэт томрохоос сэргийлж хааяа хуучныг нь хасна
            val lines = file.readLines()
            if (lines.size > MAX_ENTRIES + 100) file.writeText(lines.takeLast(MAX_ENTRIES).joinToString("\n", postfix = "\n"))
        } catch (e: Exception) {
            GatewayState.addLog("Түүх хадгалж чадсангүй: ${e.message}")
        }
    }

    // Шинэ нь эхэндээ
    @Synchronized
    fun list(context: Context): List<Map<String, Any?>> {
        val file = file(context)
        if (!file.exists()) return emptyList()
        return file.readLines().asReversed().mapNotNull { line ->
            runCatching {
                val json = JSONObject(line)
                mapOf(
                    "time" to json.optLong("time"),
                    "server" to json.optString("server"),
                    "phonenumber" to json.optString("phonenumber"),
                    "text" to json.optString("text"),
                    "status" to json.optString("status"),
                    "error" to json.optString("error"),
                )
            }.getOrNull()
        }
    }

    @Synchronized
    fun clear(context: Context) {
        file(context).delete()
    }
}
