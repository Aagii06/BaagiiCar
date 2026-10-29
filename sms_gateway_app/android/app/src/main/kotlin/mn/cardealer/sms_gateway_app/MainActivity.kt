package mn.cardealer.sms_gateway_app

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

// Flutter UI <-> native gateway (lib/gateway.dart)
class MainActivity : FlutterActivity() {
    private val requiredPermissions = buildList {
        add(Manifest.permission.SEND_SMS)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) add(Manifest.permission.POST_NOTIFICATIONS)
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "sms_gateway").setMethodCallHandler { call, result ->
            when (call.method) {
                "getConfig" -> result.success(
                    mapOf("serverUrl" to GatewayState.serverUrl(this), "token" to GatewayState.token(this)),
                )
                "status" -> result.success(
                    mapOf(
                        "running" to GatewayState.running,
                        "connected" to GatewayState.connected,
                        "lastError" to GatewayState.lastError,
                        "sentCount" to GatewayState.sentCount,
                        "failedCount" to GatewayState.failedCount,
                        "log" to GatewayState.logLines(),
                        "smsPermission" to hasPermission(Manifest.permission.SEND_SMS),
                        "batteryUnrestricted" to isIgnoringBatteryOptimizations(),
                    ),
                )
                "start" -> {
                    GatewayState.save(this, call.argument<String>("serverUrl") ?: "", call.argument<String>("token") ?: "")
                    GatewayState.setEnabled(this, true)
                    GatewayService.start(this)
                    result.success(null)
                }
                "stop" -> {
                    GatewayState.setEnabled(this, false)
                    GatewayService.stop(this)
                    result.success(null)
                }
                "requestPermissions" -> {
                    requestPermissions(requiredPermissions.toTypedArray(), 1)
                    result.success(null)
                }
                "requestBatteryUnrestricted" -> {
                    requestIgnoreBatteryOptimizations()
                    result.success(null)
                }
                "sendTest" -> {
                    val phone = call.argument<String>("phonenumber") ?: ""
                    Thread {
                        val error = SmsSender.send(this, phone, "Cardealer SMS gateway: туршилтын мессеж")
                        GatewayState.addLog(if (error == null) "✓ Туршилт $phone руу илгээлээ" else "✗ Туршилт $phone: $error")
                        runOnUiThread { result.success(error) }
                    }.start()
                }
                else -> result.notImplemented()
            }
        }
    }

    private fun hasPermission(permission: String) =
        checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED

    private fun isIgnoringBatteryOptimizations() =
        (getSystemService(POWER_SERVICE) as PowerManager).isIgnoringBatteryOptimizations(packageName)

    // Doze горимд сүлжээ тасрахаас сэргийлж батарейн хязгаарлалтаас чөлөөлнө
    @SuppressLint("BatteryLife")
    private fun requestIgnoreBatteryOptimizations() {
        startActivity(
            Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).setData(Uri.parse("package:$packageName")),
        )
    }
}
