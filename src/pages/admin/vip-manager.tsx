
import { useEffect, useState } from "react";
import {
  createAdminRecord,
  getAdminCollection,
  getAdById,
  setAdVip,
  updateAdminRecord,
} from "@/lib/firestore";

type Row = Record<string, any> & { id: string };

export default function VipManager() {
  const [plans, setPlans] = useState<Row[]>([]);
  const [name, setName] = useState("VIP 30 күн");
  const [days, setDays] = useState("30");
  const [price, setPrice] = useState("0");
  const [adId, setAdId] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    setPlans(await getAdminCollection("vipPlans"));
  };

  useEffect(() => {
    void load().catch(console.error);
  }, []);

  const add = async () => {
    try {
      await createAdminRecord("vipPlans", {
        name: name.trim(),
        days: Math.max(1, Math.min(3650, Number(days) || 30)),
        price: Math.max(0, Number(price) || 0),
        active: true,
      });

      await load();
      setMsg("VIP жоспары сақталды.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Қате");
    }
  };

  const apply = async () => {
    try {
      if (!adId.trim()) {
        throw new Error("Жарнама ID енгізіңіз");
      }

      const ad = await getAdById(adId.trim());

      if (!ad) {
        throw new Error("Жарнама табылмады");
      }

      await setAdVip(ad.id, true, Number(days) || 30);
      setMsg("VIP мерзімі қосылды.");
      setAdId("");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Қате");
    }
  };

  return (
    <section className="space-y-4 text-slate-900">
      <h2 className="text-xl font-bold">VIP және тарифтер</h2>

      <div className="grid gap-2 sm:grid-cols-3">
        <input
          className="rounded-lg border p-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Жоспар атауы"
        />

        <input
          className="rounded-lg border p-2"
          type="number"
          value={days}
          onChange={(e) => setDays(e.target.value)}
          placeholder="Күн саны"
        />

        <input
          className="rounded-lg border p-2"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Бағасы (₸)"
        />
      </div>

      <button
        className="rounded-lg bg-blue-600 px-4 py-2 text-white"
        onClick={() => void add()}
      >
        Жоспар қосу
      </button>

      <div className="flex gap-2">
        <input
          className="min-w-0 flex-1 rounded-lg border p-2"
          value={adId}
          onChange={(e) => setAdId(e.target.value)}
          placeholder="Жарнама ID"
        />

        <button
          className="rounded-lg bg-amber-500 px-3 py-2 text-white"
          onClick={() => void apply()}
        >
          VIP қосу
        </button>
      </div>

      {msg && <p className="text-sm">{msg}</p>}

      {plans.map((p) => (
        <article
          key={p.id}
          className="flex items-center justify-between rounded-xl border bg-white p-3"
        >
          <div>
            <b>{p.name}</b>
            <p className="text-sm text-slate-500">
              {p.days} күн · {p.price} ₸
            </p>
          </div>

          <button
            className="rounded border px-3 py-1 text-sm"
            onClick={() =>
              void updateAdminRecord("vipPlans", p.id, {
                active: !p.active,
              }).then(load)
            }
          >
            {p.active ? "Белсенді" : "Өшірулі"}
          </button>
        </article>
      ))}
    </section>
  );
}
