"use client";

import { Field, FormError, inputClass, PhoneInput, Select } from "@/components/common/Field";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { useConfirm } from "@/components/common/Confirm";
import { errorMessage, useToast } from "@/components/common/Toast";
import { DetailHeader } from "@/components/layout/PageHeader";
import { deleteCustomer, getCustomer, updateCustomer, type CustomerInput } from "@/lib/api/admin";
import type { Customer } from "@/lib/api/types";
import { useApi } from "@/lib/useApi";
import { useRouteId } from "@/lib/useRouteId";
import { timeAgo } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CustomerAvatar, customerName } from "../page";

function CustomerForm({ customer }: { customer: Customer }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [f, setF] = useState({
    lastname: customer.lastname ?? "",
    firstname: customer.firstname ?? "",
    phonenumber: customer.phonenumber ?? "",
    email: customer.email ?? "",
    status: customer.status === "inactive" ? "inactive" : "active",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    // They sign in with one of these, so at least one has to stay.
    if (!f.phonenumber && !f.email.trim()) return setError("Утас эсвэл и-мэйлийн аль нэгийг оруулна уу");
    setBusy(true);
    setError(null);
    const body: CustomerInput = {
      lastname: f.lastname.trim() || null,
      firstname: f.firstname.trim() || null,
      phonenumber: f.phonenumber || null,
      email: f.email.trim() || null,
      status: f.status as CustomerInput["status"],
    };
    try {
      await updateCustomer(customer.id, body);
      toast("Хадгаллаа");
      router.push("/customers");
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  const remove = async () => {
    const ok = await confirm({
      title: "Хэрэглэгчийг устгах уу?",
      message: `${customerName(customer)} — дахин нэвтэрч чадахгүй болно.`,
      confirmLabel: "Устгах",
      tone: "danger",
      icon: Trash2,
    });
    if (!ok) return;
    try {
      await deleteCustomer(customer.id);
      toast("Устгалаа");
      router.push("/customers");
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <section className="flex items-center gap-3 rounded-2xl bg-card p-4">
        <CustomerAvatar customer={customer} className="size-14" />
        <div className="min-w-0 text-xs text-muted-foreground">
          <p>Бүртгүүлсэн: {customer.created_at?.slice(0, 10) ?? "—"}</p>
          <p>Сүүлд нэвтэрсэн: {customer.last_login_at ? timeAgo(customer.last_login_at) : "—"}</p>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl bg-card p-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Овог">
            <input className={inputClass} value={f.lastname} onChange={set("lastname")} />
          </Field>
          <Field label="Нэр">
            <input className={inputClass} value={f.firstname} onChange={set("firstname")} />
          </Field>
        </div>
        <Field label="Утасны дугаар">
          <PhoneInput autoComplete="off" placeholder="00000000" value={f.phonenumber} onChange={(phonenumber) => setF({ ...f, phonenumber })} />
        </Field>
        <Field label="И-мэйл">
          <input className={inputClass} type="email" value={f.email} onChange={set("email")} />
        </Field>
        <Field label="Төлөв" hint="Идэвхгүй хэрэглэгч вэб дээр нэвтэрч чадахгүй">
          <Select value={f.status} onChange={set("status")}>
            <option value="active">Идэвхтэй</option>
            <option value="inactive">Идэвхгүй</option>
          </Select>
        </Field>
      </section>

      <FormError message={error} />
      <button disabled={busy} className="h-12 w-full rounded-xl bg-primary font-bold text-white disabled:opacity-60">
        {busy ? "Хадгалж байна…" : "Хадгалах"}
      </button>
      <button type="button" onClick={remove} className="w-full rounded-xl bg-destructive-soft py-3 text-sm font-bold text-destructive">
        Устгах
      </button>
    </form>
  );
}

export default function CustomerPage() {
  const id = useRouteId();
  const data = useApi(() => getCustomer(id), id);

  return (
    <>
      <DetailHeader title={data.data ? customerName(data.data) : "Хэрэглэгч"} back="/customers" />
      {data.loading && !data.data ? (
        <LoadingState />
      ) : data.error ? (
        <ErrorState message={data.error.message} onRetry={data.reload} />
      ) : !data.data || data.data.status === "deleted" ? (
        <EmptyState title="Хэрэглэгч олдсонгүй" />
      ) : (
        <CustomerForm key={data.data.id} customer={data.data} />
      )}
    </>
  );
}
