package mn.cardealer.sms_gateway_app

import android.app.Activity
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.telephony.SmsManager
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger

// SIM-ээр SMS илгээж, сүлжээ хүлээж авсан эсэхийг (SENT үр дүн) хүлээнэ.
// Утасны "үндсэн SMS SIM"-ийг ашиглана (Тохиргоо > SIM картууд).
object SmsSender {
    private const val ACTION_SENT = "mn.cardealer.sms_gateway_app.SMS_SENT"
    private val requestCodes = AtomicInteger(1)

    // Амжилттай бол null, үгүй бол алдааны тайлбар
    fun send(context: Context, phonenumber: String, text: String): String? {
        val manager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S)
            context.getSystemService(SmsManager::class.java)
        else @Suppress("DEPRECATION") SmsManager.getDefault()

        val parts = manager.divideMessage(text)
        val latch = CountDownLatch(parts.size)
        var error: String? = null
        val action = "$ACTION_SENT.${requestCodes.incrementAndGet()}"

        val receiver = object : BroadcastReceiver() {
            override fun onReceive(c: Context, intent: Intent) {
                if (resultCode != Activity.RESULT_OK) error = describe(resultCode)
                latch.countDown()
            }
        }
        val filter = IntentFilter(action)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU)
            context.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
        else context.registerReceiver(receiver, filter)

        try {
            val sentIntents = ArrayList(parts.map {
                PendingIntent.getBroadcast(
                    context, requestCodes.incrementAndGet(),
                    Intent(action).setPackage(context.packageName),
                    PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE,
                )
            })
            if (parts.size == 1) manager.sendTextMessage(phonenumber, null, text, sentIntents[0], null)
            else manager.sendMultipartTextMessage(phonenumber, null, parts, sentIntents, null)

            if (!latch.await(60, TimeUnit.SECONDS)) return "Сүлжээнээс хариу ирсэнгүй (timeout)"
            return error
        } catch (e: Exception) {
            return e.message ?: e.javaClass.simpleName
        } finally {
            context.unregisterReceiver(receiver)
        }
    }

    private fun describe(code: Int) = when (code) {
        SmsManager.RESULT_ERROR_GENERIC_FAILURE -> "Ерөнхий алдаа (данс/SIM шалгана уу)"
        SmsManager.RESULT_ERROR_NO_SERVICE -> "Сүлжээ байхгүй"
        SmsManager.RESULT_ERROR_RADIO_OFF -> "Радио унтраалттай (нислэгийн горим?)"
        SmsManager.RESULT_ERROR_NULL_PDU -> "PDU алдаа"
        else -> "Алдаа ($code)"
    }
}
