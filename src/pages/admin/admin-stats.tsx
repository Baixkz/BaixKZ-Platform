import { useState, useEffect } from "react";
import { Megaphone, Users, FolderTree, Crown, CheckCircle, Clock } from "lucide-react";
// ТҮЗЕТУ: Динамикалық деректерді нақты уақытта алу үшін auth-context пен firestore логикасын қолданамыз
import { getAdStats, getAllUsers, getAllCategories } from "@/lib/firestore";
import { useAuth } from "@/lib/auth-context";

export function AdminStats() {
  const { isAdmin } = useAuth(); // Админ екенін тексеру
  const [stats, setStats] = useState({ total: 0, active: 0, moderation: 0, vip: 0 });
  const [userCount, setUserCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Егер админ болмаса, деректерді жүктеудің қажеті жоқ
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    loadStats();
  }, [isAdmin]);

  const loadStats = async () => {
    try {
      setLoading(true);
      // Барлық деректерді параллельді түрде тарту
      const [adStats, users, cats] = await Promise.all([
        getAdStats().catch(() => null), // Қате болса тоқтап қалмауы үшін
        getAllUsers().catch(() => []),
        getAllCategories().catch(() => []),
      ]);

      if (adStats) {
        setStats({
          total: adStats.total || 0,
          active: adStats.active || 0,
          moderation: adStats.moderation || 0,
          vip: adStats.vip || 0
        });
      }

      setUserCount(Array.isArray(users) ? users.length : 0);
      setCategoryCount(Array.isArray(cats) ? cats.length : 0);
      
    } catch (e) {
      console.error("Статистиканы жүктеу қатесі:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Егер админ емес адам кіріп кетсе (қауіпсіздік үшін)
  if (!isAdmin) {
    return (
      <div className="p-8 text-center bg-red-50 rounded-2xl border border-red-100">
        <p className="text-red-500 font-bold">Рұқсат шектелген. Деректерді көру үшін админ құқығы керек.</p>
      </div>
    );
  }

  const cards = [
    { label: "Барлық жарнамалар", value: stats.total, icon: Megaphone, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Белсенді", value: stats.active, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Модерацияда", value: stats.moderation, icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "VIP жарнамалар", value: stats.vip, icon: Crown, color: "text-purple-500", bg: "bg-purple-50" },
    { label: "Пайдаланушылар", value: userCount, icon: Users, color: "text-rose-500", bg: "bg-rose-50" },
    { label: "Категориялар", value: categoryCount, icon: FolderTree, color: "text-cyan-500", bg: "bg-cyan-50" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="bg-white border border-slate-100 rounded-[24px] p-5 shadow-sm hover:shadow-md transition-all">
          <div className={`w-10 h-10 rounded-2xl ${card.bg} flex items-center justify-center mb-3`}>
            <card.icon className={`w-5 h-5 ${card.color}`} />
          </div>
          <p className="text-2xl font-black text-slate-800 tracking-tight">{card.value}</p>
          <p className="text-[10px] uppercase font-black text-slate-400 mt-1 tracking-widest">
            {card.label}
          </p>
        </div>
      ))}
    </div>
  );
}
