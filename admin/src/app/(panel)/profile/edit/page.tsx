"use client";

import { Field, FormError, inputClass, PhoneInput, Select } from "@/components/common/Field";
import ImageInput from "@/components/common/ImageInput";
import { errorMessage, useToast } from "@/components/common/Toast";
import { DetailHeader } from "@/components/layout/PageHeader";
import EmailOtpSheet from "@/components/profile/EmailOtpSheet";
import OtpSheet from "@/components/profile/OtpSheet";
import { getDealers, sendEmailChangeCode, sendPhoneChangeCode, sendPhoneVerifyCode, updateRow, verifyPhone, verifyPhoneChange } from "@/lib/api/admin";
import type { User } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import { roleLabel, ROLES } from "@/lib/constants";
import { useApi } from "@/lib/useApi";
import { cn } from "@/lib/utils";
import { BadgeCheck, Loader2, ShieldAlert, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/** The signed-in user's own details, photo and dealer. Role and status stay as they are. */
function ProfileForm({ me }: { me: User }) {
  const router = useRouter();
  const toast = useToast();
  const { refreshUser } = useAuth();
  const isAdmin = me.role === ROLES.admin;
  const dealers = useApi(getDealers);
  const [f, setF] = useState({
    lastname: me.lastname ?? "",
    firstname: me.firstname ?? "",
    phonenumber: me.phonenumber ?? "",
    email: me.email ?? "",
    profile: me.profile ?? "",
    dealer_id: me.dealer_id ? String(me.dealer_id) : "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Email changes only through a code sent to the new address (saved by the verify call, not by "Хадгалах").
  const [verifiedEmail, setVerifiedEmail] = useState(me.email ?? "");
  const [sending, setSending] = useState(false);
  const [otp, setOtp] = useState<{ email: string; resendIn: number } | null>(null);
  const newEmail = f.email.trim().toLowerCase();
  const emailChanged = newEmail !== verifiedEmail.toLowerCase();
  // Resend wait for the last address a code went to; counts down under the field too.
  const [emailWait, setEmailWait] = useState<{ email: string; left: number } | null>(null);
  const emailCooldown = emailWait?.email === newEmail ? emailWait.left : 0;
  useEffect(() => {
    if (!emailWait || emailWait.left <= 0) return;
    const timer = window.setTimeout(() => setEmailWait((w) => w && { ...w, left: w.left - 1 }), 1000);
    return () => window.clearTimeout(timer);
  }, [emailWait]);
  // Phone: the saved number is verified by SMS code; a new number changes only through a code sent to it.
  const [verifiedPhone, setVerifiedPhone] = useState(me.phonenumber ?? "");
  const [phoneVerified, setPhoneVerified] = useState(Boolean(me.phone_verified_at));
  const [phoneOtp, setPhoneOtp] = useState<{ resendIn: number } | null>(null);
  const [sendingPhone, setSendingPhone] = useState(false);
  const [phoneChange, setPhoneChange] = useState<{ phone: string; resendIn: number } | null>(null);
  const phoneChanged = f.phonenumber !== verifiedPhone;
  const [phoneWait, setPhoneWait] = useState<{ phone: string; left: number } | null>(null);
  const phoneCooldown = phoneWait?.phone === f.phonenumber ? phoneWait.left : 0;
  useEffect(() => {
    if (!phoneWait || phoneWait.left <= 0) return;
    const timer = window.setTimeout(() => setPhoneWait((w) => w && { ...w, left: w.left - 1 }), 1000);
    return () => window.clearTimeout(timer);
  }, [phoneWait]);

  const sendPhoneChange = async () => {
    if (f.phonenumber.length !== 8) return setError("Утасны дугаар 8 оронтой байна");
    setSendingPhone(true);
    setError(null);
    try {
      const sent = await sendPhoneChangeCode(f.phonenumber);
      setPhoneWait({ phone: f.phonenumber, left: sent.resend_in });
      setPhoneChange({ phone: f.phonenumber, resendIn: sent.resend_in });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSendingPhone(false);
    }
  };

  const sendPhoneCode = async () => {
    setSendingPhone(true);
    setError(null);
    try {
      const sent = await sendPhoneVerifyCode();
      setPhoneOtp({ resendIn: sent?.resend_in ?? 60 });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSendingPhone(false);
    }
  };

  const sendCode = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return setError("Имэйл хаяг буруу байна");
    setSending(true);
    setError(null);
    try {
      const sent = await sendEmailChangeCode(newEmail);
      setEmailWait({ email: newEmail, left: sent.resend_in });
      setOtp({ email: newEmail, resendIn: sent.resend_in });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneChanged) return setError("Шинэ дугаараа кодоор баталгаажуулна уу");
    if (emailChanged) return setError(newEmail ? "Шинэ имэйлээ кодоор баталгаажуулна уу" : "Имэйлийг хоосон болгох боломжгүй");
    setBusy(true);
    setError(null);
    try {
      await updateRow("users", me.id, {
        lastname: f.lastname.trim() || null,
        firstname: f.firstname.trim() || null,
        // Validated by the endpoint but ignored for your own account: a new number goes through /phone-change.
        phonenumber: verifiedPhone,
        profile: f.profile || null,
        // Only admins pick their dealer; the backend ignores it for everyone else.
        ...(isAdmin && { dealer_id: f.dealer_id ? Number(f.dealer_id) : null }),
        // The update endpoint validates the role; send the current one unchanged.
        role: me.role,
      });
      await refreshUser();
      toast("Хадгаллаа");
      router.push("/profile");
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <>
      <form onSubmit={submit} className="space-y-4">
        <section className="space-y-4 rounded-2xl bg-card p-4">
          <div>
            <span className="mb-1.5 block text-[13px] font-semibold">Профайл зураг</span>
            <ImageInput value={f.profile} onChange={(profile) => setF({ ...f, profile })} folder="users" label="Зураг оруулах" hint="Дөрвөлжин зураг хамгийн сайн харагдана" round />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Овог">
              <input className={inputClass} value={f.lastname} onChange={(e) => setF({ ...f, lastname: e.target.value })} />
            </Field>
            <Field label="Нэр">
              <input className={inputClass} value={f.firstname} onChange={(e) => setF({ ...f, firstname: e.target.value })} />
            </Field>
          </div>
          <Field
            label="Утасны дугаар *"
            hint={
              phoneChanged && phoneCooldown > 0
                ? `Код дахин авах: ${phoneCooldown} сек`
                : phoneChanged
                  ? "Шинэ дугаар руу SMS код илгээгдэнэ"
                  : phoneVerified
                    ? undefined
                    : me.phone_verify_deadline
                      ? `Утсаа баталгаажуулна уу. ${me.phone_verify_deadline.slice(0, 16)} хүртэл баталгаажуулаагүй бол бүртгэл устна`
                      : "Утсаа SMS кодоор баталгаажуулна уу"
            }
          >
            <span className="relative block">
              <PhoneInput
                autoComplete="tel"
                placeholder="00000000"
                value={f.phonenumber}
                onChange={(phonenumber) => setF({ ...f, phonenumber })}
                required
                className={phoneChanged ? "pr-28" : phoneVerified ? "pr-10" : "pr-14"}
              />
              {phoneChanged ? (
                <button
                  type="button"
                  onClick={sendPhoneChange}
                  disabled={sendingPhone || phoneCooldown > 0 || f.phonenumber.length !== 8}
                  className="absolute right-1.5 top-1/2 flex h-9 -translate-y-1/2 items-center gap-1.5 rounded-lg bg-primary-soft px-3 text-sm font-bold text-primary disabled:opacity-60"
                >
                  {sendingPhone && <Loader2 className="size-4 animate-spin" />}
                  Код авах
                </button>
              ) : phoneVerified ? (
                <BadgeCheck aria-label="Баталгаажсан" className="absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-success" />
              ) : (
                <button
                  type="button"
                  onClick={sendPhoneCode}
                  disabled={sendingPhone}
                  aria-label="Утас баталгаажуулах"
                  title="Утас баталгаажуулах"
                  className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg bg-primary-soft text-primary disabled:opacity-60"
                >
                  {sendingPhone ? <Loader2 className="size-5 animate-spin" /> : <ShieldAlert className="size-5" />}
                </button>
              )}
            </span>
          </Field>
          <Field
            label="И-мэйл"
            hint={
              emailChanged && emailCooldown > 0
                ? `Код дахин авах: ${emailCooldown} сек`
                : emailChanged
                  ? "Шинэ хаяг руу баталгаажуулах код илгээгдэнэ"
                  : verifiedEmail
                    ? undefined
                    : "Имэйл нэмэхэд баталгаажуулах код илгээгдэнэ"
            }
          >
            <span className="relative block">
              <input
                className={cn(inputClass, emailChanged && newEmail ? "pr-28" : verifiedEmail && "pr-10")}
                type="email"
                value={f.email}
                onChange={(e) => setF({ ...f, email: e.target.value })}
              />
              {emailChanged && newEmail ? (
                <button
                  type="button"
                  onClick={sendCode}
                  disabled={sending || emailCooldown > 0}
                  className="absolute right-1.5 top-1/2 flex h-9 -translate-y-1/2 items-center gap-1.5 rounded-lg bg-primary-soft px-3 text-sm font-bold text-primary disabled:opacity-60"
                >
                  {sending && <Loader2 className="size-4 animate-spin" />}
                  Код авах
                </button>
              ) : (
                !emailChanged && verifiedEmail && <BadgeCheck aria-label="Баталгаажсан" className="absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-success" />
              )}
            </span>
          </Field>
          <Field label="Дилер" hint={isAdmin ? "Шинэ зар нэмэхэд энэ дилер санал болгогдоно" : "Таны зарууд энэ дилерт харьяалагдана. Солихыг админаас хүснэ үү"}>
            {/* Placeholder grey goes on the select: browsers ignore colour on <option>. */}
            <Select value={f.dealer_id} onChange={(e) => setF({ ...f, dealer_id: e.target.value })} disabled={!isAdmin} className={f.dealer_id ? undefined : "text-muted-foreground"}>
              <option value="">-- Сонгох --</option>
              {f.dealer_id && dealers.data && !dealers.data.some((d) => String(d.id) === f.dealer_id) && <option value={f.dealer_id}>#{f.dealer_id} (идэвхгүй)</option>}
              {dealers.data?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
          <p className="text-xs text-muted-foreground">Эрх: {roleLabel(me.role)}</p>
        </section>

        <FormError message={error} />
        <button disabled={busy} className="h-12 w-full rounded-xl bg-primary font-bold text-white disabled:opacity-60">
          {busy ? "Хадгалж байна…" : "Хадгалах"}
        </button>
      </form>

      {/* Outside the form: the sheet has its own <form>, and nested submits would bubble into this one. */}
      {otp && (
        <EmailOtpSheet
          email={otp.email}
          resendIn={emailWait?.email === otp.email ? emailWait.left : otp.resendIn}
          onResent={(left) => setEmailWait({ email: otp.email, left })}
          onClose={() => setOtp(null)}
          onVerified={async (user) => {
            setOtp(null);
            setVerifiedEmail(user?.email ?? otp.email);
            setF((p) => ({ ...p, email: user?.email ?? otp.email }));
            await refreshUser();
            toast("Имэйл баталгаажиж шинэчлэгдлээ");
          }}
        />
      )}
      {phoneOtp && (
        <OtpSheet
          icon={<Smartphone className="size-7" />}
          title="Утас баталгаажуулах"
          target={verifiedPhone}
          length={4}
          resendIn={phoneOtp.resendIn}
          resend={sendPhoneVerifyCode}
          verify={verifyPhone}
          onClose={() => setPhoneOtp(null)}
          onVerified={async () => {
            setPhoneOtp(null);
            setPhoneVerified(true);
            await refreshUser();
            toast("Утас баталгаажлаа");
          }}
        />
      )}
      {phoneChange && (
        <OtpSheet
          icon={<Smartphone className="size-7" />}
          title="Утасны дугаар солих"
          target={phoneChange.phone}
          length={4}
          resendIn={phoneWait?.phone === phoneChange.phone ? phoneWait.left : phoneChange.resendIn}
          resend={() => sendPhoneChangeCode(phoneChange.phone)}
          onResent={(left) => setPhoneWait({ phone: phoneChange.phone, left })}
          verify={(code) => verifyPhoneChange(phoneChange.phone, code)}
          onClose={() => setPhoneChange(null)}
          onVerified={async (user) => {
            setPhoneChange(null);
            setVerifiedPhone(user?.phonenumber ?? phoneChange.phone);
            setPhoneVerified(Boolean(user?.phone_verified_at));
            setF((p) => ({ ...p, phonenumber: user?.phonenumber ?? phoneChange.phone }));
            await refreshUser();
            toast("Утасны дугаар солигдлоо");
          }}
        />
      )}
    </>
  );
}

export default function ProfileEditPage() {
  const { user } = useAuth();
  return (
    <>
      <DetailHeader title="Профайл засах" back="/profile" />
      {user && <ProfileForm key={user.id} me={user} />}
    </>
  );
}
