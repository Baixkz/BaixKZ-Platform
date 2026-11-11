import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { auth } from "../../lib/firebase";
import { backendRequest } from "../../lib/backend-api";

type StoreData = { id: string; name: string; status: string; village: string; products: Array<{ id: string; name: string; price: string | number; status: string }> };

export default function StoreDashboardPage() {
  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [storeForm, setStoreForm] = useState({ name: "", description: "", phone: "", whatsapp: "", village: "", address: "" });
  const [productForm, setProductForm] = useState({ name: "", description: "", price: "", category: "Басқа", imageUrl: "" });

  async function loadStore() {
    try { const result = await backendRequest<StoreData>("/my/store"); setStore(result); setError(""); }
    catch (e) { setStore(null); setError(e instanceof Error ? e.message : "Дүкен дерегін алу сәтсіз."); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadStore(); }, []);

  async function registerStore(event: FormEvent) {
    event.preventDefault(); setError("");
    try { await backendRequest("/stores", { method: "POST", body: JSON.stringify(storeForm) }); await loadStore(); }
    catch (e) { setError(e instanceof Error ? e.message : "Дүкен тіркелмеді."); }
  }
  async function addProduct(event: FormEvent) {
    event.preventDefault(); setError("");
    try { await backendRequest("/my/store/products", { method: "POST", body: JSON.stringify({ ...productForm, price: Number(productForm.price) }) }); setProductForm({ name: "", description: "", price: "", category: "Басқа", imageUrl: "" }); await loadStore(); }
    catch (e) { setError(e instanceof Error ? e.message : "Тауар қосылмады."); }
  }

  if (!auth.currentUser) return <main className="mx-auto max-w-xl p-6"><h1 className="text-xl font-bold">Дүкен кабинеті</h1><p className="mt-2 text-gray-600">Дүкенді басқару үшін алдымен Google аккаунтымен кіріңіз.</p><Link to="/" className="mt-4 inline-block text-blue-600">Басты бетке қайту</Link></main>;
  if (loading) return <p className="p-12 text-center">Жүктелуде…</p>;
  return <main className="mx-auto min-h-screen max-w-3xl px-4 py-6"><Link to="/stores" className="text-sm text-blue-600">← Дүкендерге қайту</Link><h1 className="mb-5 mt-3 text-2xl font-bold">Дүкен кабинеті</h1>{error && <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{error}</p>}{!store ? <form onSubmit={registerStore} className="space-y-3 rounded-2xl border bg-white p-5"><h2 className="text-lg font-semibold">Дүкенді тіркеу</h2>{([['name','Дүкен атауы'],['description','Сипаттамасы'],['phone','Байланыс телефоны'],['whatsapp','WhatsApp нөмірі'],['village','Ауыл'],['address','Мекенжай']] as const).map(([key,label]) => <label key={key} className="block text-sm font-medium">{label}<input required={key !== 'description' && key !== 'address'} value={storeForm[key]} onChange={(e) => setStoreForm({ ...storeForm, [key]: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-3 font-normal"/></label>)}<button className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white">Тіркеуге жіберу</button><p className="text-xs text-gray-500">Дүкен алдымен әкімшілік тексеруіне жіберіледі. Мақұлданғаннан кейін тауар қоса аласыз.</p></form> : <><section className="rounded-2xl border bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">{store.name}</h2><p className="text-sm text-gray-500">{store.village}</p></div><span className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">{store.status === 'ACTIVE' ? 'Белсенді' : store.status === 'PENDING' ? 'Тексерілуде' : store.status}</span></div></section>{store.status === 'ACTIVE' && <form onSubmit={addProduct} className="mt-5 space-y-3 rounded-2xl border bg-white p-5"><h2 className="text-lg font-semibold">Жаңа тауар қосу</h2><input required placeholder="Тауар атауы" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className="w-full rounded-xl border px-3 py-3"/><textarea placeholder="Сипаттамасы" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} className="w-full rounded-xl border px-3 py-3"/><input required type="number" min="1" placeholder="Бағасы (₸)" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} className="w-full rounded-xl border px-3 py-3"/><input placeholder="Санаты" value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} className="w-full rounded-xl border px-3 py-3"/><input type="url" placeholder="Сурет URL (әзірге сілтеме)" value={productForm.imageUrl} onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })} className="w-full rounded-xl border px-3 py-3"/><button className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white">Тауарды жариялау</button></form>}<section className="mt-5 rounded-2xl border bg-white p-5"><h2 className="mb-3 text-lg font-semibold">Тауарлар ({store.products.length})</h2>{store.products.length === 0 ? <p className="text-sm text-gray-500">Тауар әзірге жоқ.</p> : store.products.map((product) => <div key={product.id} className="flex items-center justify-between border-b py-3 last:border-0"><div><p className="font-medium">{product.name}</p><p className="text-sm text-gray-500">{Number(product.price).toLocaleString('kk-KZ')} ₸</p></div><span className="text-xs text-gray-500">{product.status}</span></div>)}</section></>}</main>;
}
