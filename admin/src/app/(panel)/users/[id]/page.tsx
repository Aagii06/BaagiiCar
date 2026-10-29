"use client";

import { Field, FormError, inputClass, PasswordInput, PhoneInput, Select } from "@/components/common/Field";
import { EmptyState, ErrorState, FormSkeleton } from "@/components/common/States";
import { useConfirm } from "@/components/common/Confirm";
import { errorMessage, useToast } from "@/components/common/Toast";
import { DetailHeader } from "@/components/layout/PageHeader";
import ImageInput from "@/components/common/ImageInput";
import { changePassword, createUser, deleteRows, getDealers, getUser, updateRow } from "@/lib/api/admin";
import type { User } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ROLE_LIST, roleLabel, ROLES } from "@/lib/constants";
import { useApi } from "@/lib/useApi";
import { userName } from "@/lib/utils";
import { BadgeCheck, Loader2, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRouteId } from "@/lib/useRouteId";
import { useEffect, useState } from "react";

/** Lets the header's save icon submit the form via `form={USER_FORM_ID}`. */
const USER_FORM_ID = "user-form";

function UserForm({ user, onBusyChange }: { user: User | null; onBusyChange?: (busy: boolean) => void }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const { user: me } = useAuth();
  const [f, setF] = useState({
    lastname: user?.lastname ?? "",
    firstname: user?.firstname ?? "",
    phonenumber: user?.phonenumber ?? "",
    email: user?.email ?? "",
    role: user?.role ?? ROLES.dealer,
    status: user?.status ?? "active",
    profile: user?.profile ?? "",
    dealer_id: user?.dealer_id ? String(user.dealer_id) : "",
    password: "",
    password_confirm: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => onBusyChange?.(busy), [busy, onBusyChange]);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: k === "phonenumber" ? e.target.value.replace(/\D/g, "") : e.target.value });
  const isMe = user?.id === me?.id;
  // Дилерт зөвхөн админ, дилер эрхтэй хэрэглэгч харьяалагдана
  const canHaveDealer = f.role === ROLES.admin || f.role === ROLES.dealer;
  // Бүртгэлтэй (админ бус) хэрэглэгчийг шууд админ болгохгүй - устгаад ижил дугаараар админаар бүртгэнэ
  const lockedOutOfAdmin = Boolean(user) && user?.role !== ROLES.admin;
  const dealers = useApi(getDealers);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.password !== f.password_confirm) return setError("Нууц үгийн давталт таарахгүй байна");
    if (!user && f.password.length < 6) return setError("Нууц үг хамгийн багадаа 6 тэмдэгт байна");
    setBusy(true);
    setError(null);
    const profile = {
      lastname: f.lastname || null,
      firstname: f.firstname || null,
      phonenumber: f.phonenumber,
      email: f.email || null,
      role: f.role,
      status: f.status,
      profile: f.profile || null,
      dealer_id: canHaveDealer && f.dealer_id ? Number(f.dealer_id) : null,
    };
    try {
      if (user) {
        await updateRow("users", user.id, profile);
        if (f.password) await changePassword(user.id, f.password, f.password_confirm);
      } else {
        await createUser({ ...profile, password: f.password, password_confirm: f.password_confirm });
      }
      toast("Хадгаллаа");
      router.push("/users");
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!user) return;
    const ok = await confirm({
      title: "Хэрэглэгчийг устгах уу?",
      message: `${userName(user)} — түүний идэвхтэй зарууд мөн устгагдана.`,
      confirmLabel: "Устгах",
      tone: "danger",
      icon: Trash2,
    });
    if (!ok) return;
    try {
      await deleteRows("users", [user.id]);
      toast("Устгалаа");
      router.push("/users");
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  };

  return (
    <form id={USER_FORM_ID} onSubmit={submit} className="space-y-4">
      <section className="space-y-4 rounded-2xl bg-card p-4">
        <div>
          <span className="mb-1.5 block text-[13px] font-semibold">Профайл зураг</span>
          <ImageInput value={f.profile} onChange={(profile) => setF({ ...f, profile })} folder="users" label="Зураг оруулах" hint="Дөрвөлжин зураг хамгийн сайн харагдана" round />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Овог">
            <input className={inputClass} value={f.lastname} onChange={set("lastname")} />
          </Field>
          <Field label="Нэр">
            <input className={inputClass} value={f.firstname} onChange={set("firstname")} />
          </Field>
        </div>
        <Field
          label="Утасны дугаар *"
          hint={
            !user || user.role === ROLES.admin || user.phone_verified_at
              ? undefined
              : `Утсаа баталгаажуулаагүй${user.phone_verify_deadline ? ` · ${user.phone_verify_deadline.slice(0, 16)}-д бүртгэл устна` : ""}`
          }
        >
          <span className="relative block">
            <PhoneInput
              autoComplete="off"
              placeholder="00000000"
              value={f.phonenumber}
              onChange={(phonenumber) => setF({ ...f, phonenumber })}
              required
              className={user?.phone_verified_at ? "pr-10" : undefined}
            />
            {user?.phone_verified_at && f.phonenumber === user.phonenumber && (
              <BadgeCheck aria-label="Баталгаажсан" className="absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-success" />
            )}
          </span>
        </Field>
        <Field label="И-мэйл">
          <input className={inputClass} type="email" value={f.email} onChange={set("email")} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Эрх" hint={lockedOutOfAdmin ? "Админ болгохдоо устгаад дахин админаар бүртгэнэ" : undefined}>
            <Select value={f.role} onChange={set("role")} disabled={isMe}>
              {ROLE_LIST.map((r) => (
                <option key={r} value={r} disabled={lockedOutOfAdmin && r === ROLES.admin}>
                  {roleLabel(r)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Төлөв">
            <Select value={f.status} onChange={set("status")} disabled={isMe}>
              <option value="active">Идэвхтэй</option>
              <option value="inactive">Идэвхгүй</option>
            </Select>
          </Field>
        </div>
        {canHaveDealer && (
          <Field label="Дилер" hint={f.role === ROLES.dealer ? "Энэ хэрэглэгчийн оруулсан зар уг дилерт харьяалагдана" : "Админ аль дилерийнх болох"}>
            <Select value={f.dealer_id} onChange={set("dealer_id")}>
              <option value="">-- Сонгох --</option>
              {/* A dealer that's since been deactivated stays selectable for users already in it. */}
              {f.dealer_id && dealers.data && !dealers.data.some((d) => String(d.id) === f.dealer_id) && <option value={f.dealer_id}>#{f.dealer_id} (идэвхгүй)</option>}
              {dealers.data?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </section>

      <section className="space-y-4 rounded-2xl bg-card p-4">
        <h2 className="font-bold">{user ? "Нууц үг солих" : "Нууц үг *"}</h2>
        <Field label="Нууц үг" hint={user ? "Хоосон орхивол өөрчлөгдөхгүй" : undefined}>
          <PasswordInput autoComplete="new-password" value={f.password} onChange={set("password")} required={!user} />
        </Field>
        <Field label="Нууц үг давтах">
          <PasswordInput autoComplete="new-password" value={f.password_confirm} onChange={set("password_confirm")} required={!user || !!f.password} />
        </Field>
      </section>

      <FormError message={error} />
      <button disabled={busy} className="h-12 w-full rounded-xl bg-primary font-bold text-white disabled:opacity-60">
        {busy ? "Хадгалж байна…" : "Хадгалах"}
      </button>
      {user && (
        <div className="flex gap-2">
          <Link href={`/cars?q=${user.phonenumber ?? ""}`} className="flex-1 rounded-xl bg-card py-3 text-center text-sm font-bold">
            Зарууд
          </Link>
          {!isMe && (
            <button type="button" onClick={remove} className="flex-1 rounded-xl bg-destructive-soft py-3 text-sm font-bold text-destructive">
              Устгах
            </button>
          )}
        </div>
      )}
    </form>
  );
}

export default function UserPage() {
  const id = useRouteId();
  const isNew = id === "new";
  const data = useApi(() => (isNew ? Promise.resolve(null) : getUser(id)), id);
  const [saving, setSaving] = useState(false);

  return (
    <>
      <DetailHeader
        title={isNew ? "Шинэ админ, дилер" : data.data ? userName(data.data) : "Admin & Dealer"}
        back="/users"
        aside={
          // Same as the save button at the bottom of the form.
          !isNew &&
          data.data &&
          data.data.status !== "deleted" && (
            <button
              type="submit"
              form={USER_FORM_ID}
              disabled={saving}
              aria-label="Хадгалах"
              title="Хадгалах"
              className="grid size-10 place-items-center rounded-xl bg-primary text-white hover:bg-primary-hover disabled:opacity-60"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            </button>
          )
        }
      />
      {isNew ? (
        <UserForm user={null} />
      ) : data.loading && !data.data ? (
        <FormSkeleton sections={[6, 2]} />
      ) : data.error ? (
        <ErrorState message={data.error.message} onRetry={data.reload} />
      ) : !data.data || data.data.status === "deleted" ? (
        <EmptyState title="Хэрэглэгч олдсонгүй" />
      ) : (
        <UserForm key={data.data.id} user={data.data} onBusyChange={setSaving} />
      )}
    </>
  );
}
