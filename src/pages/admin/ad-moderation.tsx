import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, X, Crown, Trash2, ChevronDown } from "lucide-react";
import { getAds, updateAd, deleteAd, type Ad } from "@/lib/firestore";
import { useToast } from "@/hooks/use-toast";

function formatDeleteDate(value: unknown): string {
  const candidate = value as { toMillis?: () => number } | null | undefined;

  if (!candidate || typeof candidate.toMillis !== "function") return "";

  return new Date(candidate.toMillis()).toLocaleDateString("kk-KZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function AdModeration() {
  const { toast } = useToast();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadAds();
  }, [filter]);

  const loadAds = async () => {
    setLoading(true);
    try {
      // ҚАТЕ ТҮЗЕТІЛДІ: getAds функциясына тек бір аргумент жібереміз
      const data = await getAds(filter || undefined);
      setAds(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: string) => {
    try {
      const currentAd = ads.find((a) => a.id === id);

      // Жасырылған жарнаманы кездейсоқ белсенді етуге болмайды
      if (currentAd?.status === "hidden" && action !== "delete") {
        toast({
          title: "Жасырылған жарнамаға бұл әрекет қолжетімсіз",
          variant: "destructive",
        });
        return;
      }

      switch (action) {
        case "approve":
          await updateAd(id, { status: "active" });
          toast({ title: "Жарнама белсенді" });
          break;
        case "reject":
          await updateAd(id, { status: "rejected" });
          toast({ title: "Жарнама қабылданбады" });
          break;
        case "vip":
          const ad = ads.find((a) => a.id === id);
          await updateAd(id, { isVip: !ad?.isVip });
          toast({ title: ad?.isVip ? "VIP алынды" : "VIP қосылды" });
          break;
        case "sold":
          await updateAd(id, { status: "sold" });
          toast({ title: "Сатылды деп белгіленді" });
          break;
        case "delete":
          if (!confirm("Жоюға сенімдісіз бе?")) return;
          await deleteAd(id);
          toast({ title: "Жарнама жойылды" });
          break;
      }
      await loadAds();
    } catch (e: any) {
      toast({ title: e.message || "Қате", variant: "destructive" });
    }
  };

  const statusLabel = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      active: { label: "Белсенді", color: "bg-emerald-100 text-emerald-700" },
      moderation: { label: "Модерация", color: "bg-amber-100 text-amber-700" },
      sold: { label: "Сатылды", color: "bg-blue-100 text-blue-700" },
      rejected: { label: "Қабылданбады", color: "bg-red-100 text-red-700" },
      hidden: { label: "Жасырылған", color: "bg-slate-200 text-slate-700" },
    };
    return map[status] || { label: status, color: "bg-gray-100 text-gray-700" };
  };

  const filters = [
    { value: "", label: "Барлығы" },
    { value: "moderation", label: "Модерация" },
    { value: "active", label: "Белсенді" },
    { value: "sold", label: "Сатылды" },
    { value: "rejected", label: "Қабылданбады" },
    { value: "hidden", label: "Жасырылған" },
  ];

  return (
    <div>
      <div className="flex gap-1.5 overflow-x-auto pb-3 mb-4 no-scrollbar">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 ${
              filter === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : ads.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Жарнамалар жоқ</div>
      ) : (
        <div className="space-y-2">
          {ads.map((ad) => {
            const st = statusLabel(ad.status);
            const isExpanded = expandedId === ad.id;
            const isHidden = ad.status === "hidden";
            const deleteDate = formatDeleteDate(ad.deleteAt);

            return (
              <div key={ad.id} className="bg-card border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : ad.id)}
                  className="w-full flex items-center gap-3 p-3 text-left"
                >
                  {ad.images?.[0] && (
                    <img src={ad.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">{ad.title}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-bold text-primary">{ad.price.toLocaleString()} KZT</span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${st.color}`}>
                        {st.label}
                      </span>
                      {ad.isVip && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">VIP</span>
                      )}
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </button>

                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="px-3 pb-3 border-t border-border pt-3"
                  >
                    <p className="text-xs text-muted-foreground mb-2">
                      {/* ҚАТЕ ТҮЗЕТІЛДІ: ownerPhone орнына phone қолданылды */}
                      {ad.ownerName} ({ad.phone}) | {ad.city}
                    </p>
                    <p className="text-xs mb-3 line-clamp-3">{ad.description}</p>

                    {isHidden && (
                      <p className="text-xs font-medium text-muted-foreground mb-3">
                        Аккаунтты жою сұранысымен жасырылған
                        {ad.prevStatus ? ` (бұрынғы мәртебесі: ${statusLabel(ad.prevStatus).label})` : ""}
                        {deleteDate ? `. Жойылу күні: ${deleteDate}` : ". Жою тоқтатылған"}
                      </p>
                    )}

                    <div className="flex gap-1.5 flex-wrap">
                      {!isHidden && ad.status === "moderation" && (
                        <button
                          onClick={() => handleAction(ad.id, "approve")}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium"
                        >
                          <Check className="w-3 h-3" /> Бекіту
                        </button>
                      )}
                      {!isHidden && ad.status === "moderation" && (
                        <button
                          onClick={() => handleAction(ad.id, "reject")}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium"
                        >
                          <X className="w-3 h-3" /> Қабылдамау
                        </button>
                      )}
                      {!isHidden && (
                        <button
                          onClick={() => handleAction(ad.id, "vip")}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium"
                        >
                          <Crown className="w-3 h-3" /> {ad.isVip ? "VIP алу" : "VIP қосу"}
                        </button>
                      )}
                      {!isHidden && ad.status !== "sold" && (
                        <button
                          onClick={() => handleAction(ad.id, "sold")}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium"
                        >
                          <Check className="w-3 h-3" /> Сатылды
                        </button>
                      )}
                      <button
                        onClick={() => handleAction(ad.id, "delete")}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium"
                      >
                        <Trash2 className="w-3 h-3" /> Жою
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
                      }
