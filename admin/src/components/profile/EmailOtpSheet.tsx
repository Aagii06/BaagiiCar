"use client";

import OtpSheet from "@/components/profile/OtpSheet";
import { sendEmailChangeCode, verifyEmailChange } from "@/lib/api/admin";
import type { User } from "@/lib/api/types";
import { MailCheck } from "lucide-react";

/**
 * Bottom sheet for confirming a new email: the code was already sent to `email` when it opens.
 * Calls `onVerified` with the updated user once the server has saved the address.
 */
export default function EmailOtpSheet({
  email,
  resendIn,
  onResent,
  onVerified,
  onClose,
}: {
  email: string;
  /** Seconds until another code may be requested (from the send response). */
  resendIn: number;
  onResent?: (seconds: number) => void;
  onVerified: (user: User) => void;
  onClose: () => void;
}) {
  return (
    <OtpSheet
      icon={<MailCheck className="size-7" />}
      title="Имэйл баталгаажуулах"
      target={email}
      length={6}
      resendIn={resendIn}
      onResent={onResent}
      resend={() => sendEmailChangeCode(email)}
      verify={(code) => verifyEmailChange(email, code)}
      onVerified={onVerified}
      onClose={onClose}
    />
  );
}
