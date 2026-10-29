"use client";

import CodeDialog from "@/components/common/CodeDialog";
import { sendEmailCode, verifyEmailCode, type WebUser } from "@/lib/api/auth";
import { useI18n } from "@/lib/i18n/I18nProvider";

/** Modal for the 6-digit code e-mailed to the new address; the address is saved once the code checks out. */
export default function EmailCodeDialog({
  email,
  token,
  resendIn,
  onResent,
  onClose,
  onVerified,
}: {
  email: string;
  token: string;
  resendIn?: number;
  onResent?: (seconds: number) => void;
  onClose: () => void;
  onVerified: (user: WebUser) => void;
}) {
  const { t } = useI18n();
  return (
    <CodeDialog
      title={t("И-мэйл баталгаажуулах")}
      description={t("{email} хаяг руу илгээсэн 6 оронтой кодыг оруулна уу.", { email })}
      length={6}
      resendIn={resendIn}
      onResent={onResent}
      resend={() => sendEmailCode(token, email)}
      verify={(code) => verifyEmailCode(token, email, code)}
      onClose={onClose}
      onVerified={onVerified}
    />
  );
}
