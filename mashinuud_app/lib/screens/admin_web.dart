import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:mashinuud_app/app/constant.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/state/stores.dart';
import 'package:url_launcher/url_launcher.dart';

/// The admin half of the app: admin.cardealer.mn in a WebView, as admins / dealers see it in the browser.
/// The panel recognises the app by [_userAgentMarker] (admin/src/lib/inApp.ts) and offers a
/// [_customerUrl] link on its sign-in page, which switches back to the customer screens.
class AdminWebScreen extends StatefulWidget {
  const AdminWebScreen({super.key});

  @override
  State<AdminWebScreen> createState() => _AdminWebScreenState();
}

const _userAgentMarker = 'CardealerApp';
const _customerUrl = 'cardealer-app://customer';
const _webSchemes = {'http', 'https', 'about', 'data', 'blob', 'javascript'};

class _AdminWebScreenState extends State<AdminWebScreen> {
  InAppWebViewController? _controller;
  double _progress = 0;

  Future<NavigationActionPolicy> _route(InAppWebViewController controller, NavigationAction action) async {
    final uri = action.request.url;
    if (uri == null) return NavigationActionPolicy.ALLOW;
    if (uri.toString().startsWith(_customerUrl)) {
      Stores.mode.setAdmin(false);
      return NavigationActionPolicy.CANCEL;
    }
    if (_webSchemes.contains(uri.scheme)) return NavigationActionPolicy.ALLOW;
    // tel:, mailto:, sms: … go to the phone's own apps.
    launchUrl(uri, mode: LaunchMode.externalApplication);
    return NavigationActionPolicy.CANCEL;
  }

  @override
  Widget build(BuildContext context) => PopScope(
        canPop: false,
        // Android back: back through the panel's pages, then leave the app.
        onPopInvokedWithResult: (didPop, _) async {
          if (didPop) return;
          final c = _controller;
          if (c != null && await c.canGoBack()) {
            c.goBack();
          } else {
            SystemNavigator.pop();
          }
        },
        child: Scaffold(
          backgroundColor: AppPalette.background,
          body: SafeArea(
            child: Stack(children: [
              InAppWebView(
                initialUrlRequest: URLRequest(url: WebUri(AppConstants.adminUrl)),
                initialSettings: InAppWebViewSettings(
                  applicationNameForUserAgent: _userAgentMarker,
                  useShouldOverrideUrlLoading: true,
                  allowsInlineMediaPlayback: true,
                  allowsBackForwardNavigationGestures: true,
                ),
                onWebViewCreated: (c) => _controller = c,
                shouldOverrideUrlLoading: _route,
                onProgressChanged: (_, p) => setState(() => _progress = p / 100),
              ),
              if (_progress < 1)
                LinearProgressIndicator(value: _progress, minHeight: 2, color: AppPalette.primary, backgroundColor: Colors.transparent),
            ]),
          ),
        ),
      );
}
