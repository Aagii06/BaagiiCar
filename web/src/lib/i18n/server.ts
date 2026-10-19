import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, pickLocale } from "./config";

export async function getLocale() {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);
  return pickLocale(cookieStore.get(LOCALE_COOKIE)?.value, headerList.get("accept-language"));
}
