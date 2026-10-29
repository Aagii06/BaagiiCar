"use client";

import { useSyncExternalStore } from "react";

// The Cardealer mobile app opens this panel in a WebView for admins / dealers and
// adds this marker to its user agent (mashinuud_app/lib/screens/admin_web.dart).
const APP_MARKER = "CardealerApp";

/** Opening this link inside the app leaves the panel for the customer side of the app. */
export const APP_CUSTOMER_URL = "cardealer-app://customer";

const inApp = () => navigator.userAgent.includes(APP_MARKER);
const noop = () => () => {};

/** Whether the panel runs inside the mobile app (false while prerendering). */
export function useInApp() {
  return useSyncExternalStore(noop, inApp, () => false);
}
