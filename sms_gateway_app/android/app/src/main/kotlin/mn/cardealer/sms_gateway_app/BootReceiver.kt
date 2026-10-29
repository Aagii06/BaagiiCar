package mn.cardealer.sms_gateway_app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

// Утас дахин асахад (өмнө нь асаалттай байсан бол) gateway-г автоматаар эхлүүлнэ
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED) return
        if (GatewayState.enabled(context) && GatewayState.serverUrl(context).isNotEmpty())
            GatewayService.start(context)
    }
}
