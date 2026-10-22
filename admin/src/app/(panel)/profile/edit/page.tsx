"use client";

import { Field, FormError, inputClass, PhoneInput, Select } from "@/components/common/Field";
import ImageInput from "@/components/common/ImageInput";
import { errorMessage, useToast } from "@/components/common/Toast";
import { DetailHeader } from "@/components/layout/PageHeader";
import EmailOtpSheet from "@/components/profile/EmailOtpSheet";
import { getDealers, sendEmailChangeCode, updateRow } from "@/lib/api/admin";
import type { User } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import { roleLabel } from "@/lib/constants";
import { useApi } from "@/lib/useApi";
import { cn } from "@/lib/utils";
import { BadgeCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** The signed-in user's own details, photo and dealer. Role and status stay as they are. */
function ProfileForm({ me }: { me: User }) {
  const router = useRouter();
  const toast = useToast();
  const { refreshUser } = useAuth();
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

  const sendCode = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return setError("Имэйл хаяг буруу байна");
    setSending(true);
    setError(null);
    try {
      const sent = await sendEmailChangeCode(newEmail);
      setOtp({ email: newEmail, resendIn: sent?.resend_in ?? 60 });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.phonenumber.length !== 8) return setError("Утасны дугаар 8 оронтой байна");
    if (emailChanged) return setError(newEmail ? "Шинэ имэйлээ кодоор баталгаажуулна уу" : "Имэйлийг хоосон болгох боломжгүй");
    setBusy(true);
    setError(null);
    try {
      await updateRow("users", me.id, {
        lastname: f.lastname.trim() || null,
        firstname: f.firstname.trim() || null,
        phonenumber: f.phonenumber,
        profile: f.profile || null,
        dealer_id: f.dealer_id ? Number(f.dealer_id) : null,
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
          <Field label="Утасны дугаар *" hint="Админ самбарт энэ дугаараар нэвтэрнэ">
            <PhoneInput autoComplete="tel" placeholder="00000000" value={f.phonenumber} onChange={(phonenumber) => setF({ ...f, phonenumber })} required />
          </Field>
          <Field
            label="И-мэйл"
            hint={emailChanged ? "Шинэ хаяг руу баталгаажуулах код илгээгдэнэ" : verifiedEmail ? undefined : "Имэйл нэмэхэд баталгаажуулах код илгээгдэнэ"}
          >
            <span className="flex gap-2">
              <span className="relative min-w-0 flex-1">
                <input className={cn(inputClass, !emailChanged && verifiedEmail && "pr-10")} type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
                {!emailChanged && verifiedEmail && <BadgeCheck aria-label="Баталгаажсан" className="absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-success" />}
              </span>
              {emailChanged && newEmail && (
                <button type="button" onClick={sendCode} disabled={sending} className="flex h-12 shrink-0 items-center gap-1.5 rounded-xl bg-primary-soft px-4 text-sm font-bold text-primary disabled:opacity-60">
                  {sending && <Loader2 className="size-4 animate-spin" />}
                  Код авах
                </button>
              )}
            </span>
          </Field>
          <Field label="Дилер" hint="Шинэ зар нэмэхэд энэ дилер санал болгогдоно">
            {/* Placeholder grey goes on the select: browsers ignore colour on <option>. */}
            <Select value={f.dealer_id} onChange={(e) => setF({ ...f, dealer_id: e.target.value })} className={f.dealer_id ? undefined : "text-muted-foreground"}>
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
          resendIn={otp.resendIn}
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
