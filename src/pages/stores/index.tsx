import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Store, Search, MapPin, ShoppingBag, ArrowRight } from "lucide-react";
import { backendRequest } from "../../lib/backend-api";

type StoreItem = { id: string; name: string; description: string; village: string; address: string; phone: string; whatsapp: string; logoUrl: string | null; _count: { products: number } };
type StoreResponse = { items: StoreItem[]; total: number };

export default function StoresPage() {
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [search, setSearch] = useState("");
  const [village, setVillage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (village.trim()) params.set("village", village.trim());
    backendRequest<StoreResponse>(`/stores?${params.toString()}`)
      .then((result) => { if (active) setStores(result.items); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Дүкендерді жүктеу сәтсіз."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [search, village]);

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div><p className="text-sm text-blue-600">BaixKZ маркеті</p><h1 className="text-2xl font-bold">Ауыл дүкендері</h1><p className="mt-1 text-sm text-gray-500">Жергілікті дүкендерді тауып, тауарларын қараңыз.</p></div>
        <Link to="/store/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white"><Store size={17}/> Дүкен кабинеті</Link>
      </div>
      <div className="mb-5 grid gap-3 rounded-2xl border bg-white p-3 shadow-sm sm:grid-cols-2">
        <label className="flex items-center gap-2 rounded-xl border px-3"><Search size={18} className="text-gray-400"/><input className="w-full py-3 outline-none" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Дүкен атауы"/></label>
        <label className="flex items-center gap-2 rounded-xl border px-3"><MapPin size={18} className="text-gray-400"/><input className="w-full py-3 outline-none" value={village} onChange={(e) => setVillage(e.target.value)} placeholder="Ауыл атауы"/></label>
      </div>
      {error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading ? <p className="py-12 text-center text-gray-500">Жүктелуде…</p> : stores.length === 0 ? <div className="rounded-2xl border bg-white p-10 text-center"><ShoppingBag className="mx-auto mb-3 text-gray-400" size={36}/><h2 className="font-semibold">Әзірге дүкен табылмады</h2><p className="mt-1 text-sm text-gray-500">Іздеу шартын өзгертіңіз немесе кейінірек қайта кіріңіз.</p></div> : <div className="grid gap-3 sm:grid-cols-2">{stores.map((store) => <Link key={store.id} to={`/stores/${store.id}`} className="group rounded-2xl border bg-white p-4 shadow-sm transition hover:border-blue-300"><div className="flex items-start gap-3"><div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-50 text-blue-600">{store.logoUrl ? <img src={store.logoUrl} alt="" className="h-full w-full object-cover"/> : <Store size={25}/>}</div><div className="min-w-0 flex-1"><h2 className="font-semibold">{store.name}</h2><p className="mt-1 line-clamp-2 text-sm text-gray-500">{store.description || "Жергілікті дүкен"}</p><p className="mt-2 text-xs text-gray-500">{store.village}{store.address ? ` · ${store.address}` : ""}</p><p className="mt-2 text-xs text-blue-600">{store._count.products} тауар</p></div><ArrowRight size={18} className="text-gray-400 transition group-hover:translate-x-1"/></div></Link>)}</div>}
    </main>
  );
}
