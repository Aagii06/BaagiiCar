"use client";

import Container from "@/components/common/Container";
import { useI18n } from "@/lib/i18n/I18nProvider";
import Link from "next/link";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <Container className="py-20 text-center">
      <p className="font-display text-6xl font-bold">404</p>
      <p className="mt-4 text-muted-foreground">{t("Хуудас олдсонгүй.")}</p>
      <Link href="/" className="mt-6 inline-block rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white">
        {t("Нүүр хуудас")}
      </Link>
    </Container>
  );
}
