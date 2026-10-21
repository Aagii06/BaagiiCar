"use client";

import { Field, FormError, inputClass, Select } from "@/components/common/Field";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { useConfirm } from "@/components/common/Confirm";
import { errorMessage, useToast } from "@/components/common/Toast";
import { DetailHeader } from "@/components/layout/PageHeader";
import { changePassword, createUser, deleteRows, getUser, updateRow } from "@/lib/api/admin";
import type { User } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ROLE_LIST, roleLabel, ROLES } from "@/lib/constants";
import { useApi } from "@/lib/useApi";
import { userName } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRouteId } from "@/lib/useRouteId";
import { useState } from "react";

function UserForm({ user }: { user: User | null }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const { user: me } = useAuth();
  const [f, setF] = useState({
    lastname: user?.lastname ?? "",
    firstname: user?.firstname ?? "",
    phonenumber: user?.phonenumber ?? "",
    email: user?.email ?? "",
    role: user?.role ?? ROLES.customer,
    status: user?.status ?? "active",
    password: "",
    password_confirm: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: k === "phonenumber" ? e.target.value.replace(/\D/g, "") : e.target.value });
  const isMe = user?.id === me?.id;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.password !== f.password_confirm) return setError("Нууц үгийн давталт таарахгүй байна");
    if (!user && f.password.length < 6) return setError("Нууц үг хамгийн багадаа 6 тэмдэгт байна");
    setBusy(true);
    setError(null);
    const profile = { lastname: f.lastname || null, firstname: f.firstname || null, phonenumber: f.phonenumber, email: f.email || null, role: f.role, status: f.status };
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
    <form onSubmit={submit} className="space-y-4">
      <section className="space-y-4 rounded-2xl bg-card p-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Овог">
            <input className={inputClass} value={f.lastname} onChange={set("lastname")} />
          </Field>
          <Field label="Нэр">
            <input className={inputClass} value={f.firstname} onChange={set("firstname")} />
          </Field>
        </div>
        <Field label="Утасны дугаар *">
          <input className={inputClass} inputMode="numeric" maxLength={8} value={f.phonenumber} onChange={set("phonenumber")} required />
        </Field>
        <Field label="И-мэйл">
          <input className={inputClass} type="email" value={f.email} onChange={set("email")} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Эрх">
            <Select value={f.role} onChange={set("role")} disabled={isMe}>
              {ROLE_LIST.map((r) => (
                <option key={r} value={r}>
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
      </section>

      <section className="space-y-4 rounded-2xl bg-card p-4">
        <h2 className="font-bold">{user ? "Нууц үг солих" : "Нууц үг *"}</h2>
        <Field label="Нууц үг" hint={user ? "Хоосон орхивол өөрчлөгдөхгүй" : undefined}>
          <input className={inputClass} type="password" autoComplete="new-password" value={f.password} onChange={set("password")} required={!user} />
        </Field>
        <Field label="Нууц үг давтах">
          <input className={inputClass} type="password" autoComplete="new-password" value={f.password_confirm} onChange={set("password_confirm")} required={!user || !!f.password} />
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

  return (
    <>
      <DetailHeader title={isNew ? "Шинэ хэрэглэгч" : data.data ? userName(data.data) : "Хэрэглэгч"} back="/users" />
      {isNew ? (
        <UserForm user={null} />
      ) : data.loading && !data.data ? (
        <LoadingState />
      ) : data.error ? (
        <ErrorState message={data.error.message} onRetry={data.reload} />
      ) : !data.data || data.data.status === "deleted" ? (
        <EmptyState title="Хэрэглэгч олдсонгүй" />
      ) : (
        <UserForm key={data.data.id} user={data.data} />
      )}
    </>
  );
}
