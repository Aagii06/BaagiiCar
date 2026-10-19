"use client";

import Container from "@/components/common/Container";
import { LoadingState } from "@/components/common/States";
import { unsubscribe } from "@/lib/api/subscriptions";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useApi } from "@/lib/useApi";
import { CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

/** Target of the "unsubscribe" link in new-listing emails. */
function UnsubscribeInner() {
  const { t } = useI18n();
  const token = useSearchParams().get("token") ?? "";
  const result = useApi(() => (token ? unsubscribe(token) : Promise.reject(new Error(t("Холбоос хүчингүй байна")))), token);

  if (result.loading) return <LoadingState className="min-h-[50vh]" />;
  const ok = !result.error;
  return (
    <Container className="max-w-md py-20 text-center">
      {ok ? <CheckCircle2 className="mx-auto size-12 text-success" /> : <XCircle className="mx-auto size-12 text-destructive" />}
      <h1 className="mt-4 text-xl font-bold">{ok ? t("Та бүртгэлээс гарлаа") : t("Бүртгэлээс гарч чадсангүй")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {ok ? t("Цаашид шинэ зарын имэйл ирэхгүй.") : result.error?.message}
      </p>
      <Link href="/" className="mt-6 inline-block rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white">
        {t("Нүүр хуудас")}
      </Link>
    </Container>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <UnsubscribeInner />
    </Suspense>
  );
}
