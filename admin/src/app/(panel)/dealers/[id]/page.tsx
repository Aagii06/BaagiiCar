"use client";

import { Field, FormError, inputClass, PhoneInput, Select } from "@/components/common/Field";
import ImageInput from "@/components/common/ImageInput";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { useConfirm } from "@/components/common/Confirm";
import { errorMessage, useToast } from "@/components/common/Toast";
import { DetailHeader } from "@/components/layout/PageHeader";
import { createDealer, deleteDealer, getDealer, updateDealer, type DealerInput } from "@/lib/api/admin";
import type { Dealer } from "@/lib/api/types";
import { useApi } from "@/lib/useApi";
import { useRouteId } from "@/lib/useRouteId";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

function DealerForm({ dealer }: { dealer: Dealer | null }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [f, setF] = useState({
    name: dealer?.name ?? "",
    logo: dealer?.logo ?? "",
    phonenumber: dealer?.phonenumber ?? "",
    email: dealer?.email ?? "",
    address: dealer?.address ?? "",
    description: dealer?.description ?? "",
    status: dealer?.status === "inactive" ? "inactive" : "active",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: k === "phonenumber" ? e.target.value.replace(/\D/g, "") : e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim()) return setError("Дилерийн нэр оруулна уу");
    setBusy(true);
    setError(null);
    const body: DealerInput = {
      name: f.name.trim(),
      logo: f.logo || null,
      phonenumber: f.phonenumber || null,
      email: f.email.trim() || null,
      address: f.address.trim() || null,
      description: f.description.trim() || null,
      status: f.status as DealerInput["status"],
    };
    try {
      if (dealer) await updateDealer(dealer.id, body);
      else await createDealer(body);
      toast("Хадгаллаа");
      router.push("/dealers");
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!dealer) return;
    const ok = await confirm({
      title: "Дилерийг устгах уу?",
      message: `${dealer.name} — вэб дээр харагдахаа болино. Зарууд нь устгагдахгүй.`,
      confirmLabel: "Устгах",
      tone: "danger",
      icon: Trash2,
    });
    if (!ok) return;
    try {
      await deleteDealer(dealer.id);
      toast("Устгалаа");
      router.push("/dealers");
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <section className="space-y-4 rounded-2xl bg-card p-4">
        <Field label="Нэр *">
          <input className={inputClass} value={f.name} onChange={set("name")} placeholder="Авто Плаза" required />
        </Field>
        <div>
          <span className="mb-1.5 block text-[13px] font-semibold">Лого</span>
          <ImageInput value={f.logo} onChange={(logo) => setF({ ...f, logo })} folder="dealers" label="Лого оруулах" hint="Дөрвөлжин, тунгалаг дэвсгэртэй зураг хамгийн сайн харагдана" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Утас" hint="Зарын холбогдох утас хоосон бол үүнийг ашиглана">
            <PhoneInput autoComplete="off" placeholder="00000000" value={f.phonenumber} onChange={(phonenumber) => setF({ ...f, phonenumber })} />
          </Field>
          <Field label="Төлөв">
            <Select value={f.status} onChange={set("status")}>
              <option value="active">Идэвхтэй</option>
              <option value="inactive">Идэвхгүй</option>
            </Select>
          </Field>
        </div>
        <Field label="И-мэйл">
          <input className={inputClass} type="email" value={f.email} onChange={set("email")} />
        </Field>
        <Field label="Хаяг">
          <input className={inputClass} value={f.address} onChange={set("address")} placeholder="Улаанбаатар, ХУД, …" />
        </Field>
        <Field label="Тайлбар">
          <textarea className={cn(inputClass, "h-auto min-h-24 py-3")} value={f.description} onChange={set("description")} maxLength={2000} />
        </Field>
      </section>

      <FormError message={error} />
      <button disabled={busy} className="h-12 w-full rounded-xl bg-primary font-bold text-white disabled:opacity-60">
        {busy ? "Хадгалж байна…" : dealer ? "Хадгалах" : "Бүртгэх"}
      </button>
      {dealer && (
        <div className="flex gap-2">
          <Link href={`/cars?dealer=${dealer.id}`} className="flex-1 rounded-xl bg-card py-3 text-center text-sm font-bold">
            Зарууд
          </Link>
          <button type="button" onClick={remove} className="flex-1 rounded-xl bg-destructive-soft py-3 text-sm font-bold text-destructive">
            Устгах
          </button>
        </div>
      )}
    </form>
  );
}

export default function DealerPage() {
  const id = useRouteId();
  const isNew = id === "new";
  const data = useApi(() => (isNew ? Promise.resolve(null) : getDealer(id)), id);

  return (
    <>
      <DetailHeader title={isNew ? "Шинэ дилер" : (data.data?.name ?? "Дилер")} back="/dealers" />
      {isNew ? (
        <DealerForm dealer={null} />
      ) : data.loading && !data.data ? (
        <LoadingState />
      ) : data.error ? (
        <ErrorState message={data.error.message} onRetry={data.reload} />
      ) : !data.data || data.data.status === "deleted" ? (
        <EmptyState title="Дилер олдсонгүй" />
      ) : (
        <DealerForm key={data.data.id} dealer={data.data} />
      )}
    </>
  );
}
