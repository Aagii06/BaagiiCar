"use client";

import { Field, FormError, inputClass, PhoneInput, Select } from "@/components/common/Field";
import ImageInput from "@/components/common/ImageInput";
import { errorMessage, useToast } from "@/components/common/Toast";
import { DetailHeader } from "@/components/layout/PageHeader";
import { getDealers, updateRow } from "@/lib/api/admin";
import type { User } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import { roleLabel } from "@/lib/constants";
import { useApi } from "@/lib/useApi";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** The signed-in user's own details, photo and dealer. Role and status stay as they are. */
function ProfileForm({ me }: { me: User }) {
  const router = useRouter();
  const toast = useToast();
  const { refreshUser } = useAuth();
  const dealers = useApi(getDealers);
  const [f, setF] = useState({
    firstname: me.firstname ?? "",
    phonenumber: me.phonenumber ?? "",
    email: me.email ?? "",
    profile: me.profile ?? "",
    dealer_id: me.dealer_id ? String(me.dealer_id) : "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.phonenumber.length !== 8) return setError("Утасны дугаар 8 оронтой байна");
    setBusy(true);
    setError(null);
    try {
      await updateRow("users", me.id, {
        firstname: f.firstname.trim() || null,
        phonenumber: f.phonenumber,
        email: f.email.trim() || null,
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
    <form onSubmit={submit} className="space-y-4">
      <section className="space-y-4 rounded-2xl bg-card p-4">
        <div>
          <span className="mb-1.5 block text-[13px] font-semibold">Профайл зураг</span>
          <ImageInput value={f.profile} onChange={(profile) => setF({ ...f, profile })} folder="users" label="Зураг оруулах" hint="Дөрвөлжин зураг хамгийн сайн харагдана" round />
        </div>
        <Field label="Нэр">
          <input className={inputClass} value={f.firstname} onChange={(e) => setF({ ...f, firstname: e.target.value })} />
        </Field>
        <Field label="Утасны дугаар *" hint="Админ самбарт энэ дугаараар нэвтэрнэ">
          <PhoneInput autoComplete="tel" placeholder="00000000" value={f.phonenumber} onChange={(phonenumber) => setF({ ...f, phonenumber })} required />
        </Field>
        <Field label="И-мэйл">
          <input className={inputClass} type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
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
