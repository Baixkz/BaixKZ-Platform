import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ImageOff,
  Loader2,
  Megaphone,
  PlusCircle,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { useAppSettings } from "@/lib/app-settings";
import { getAdsByUser } from "@/lib/firestore";
import { LoginModal } from "@/components/login-modal";
import type { Ad } from "@/types";

export default function MyAds() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language, theme, t } = useAppSettings();
  const isDark = theme === "dark";
  const isRu = language === "ru";
  const locale = isRu ? "ru-RU" : "kk-KZ";

  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const text = {
    title: isRu ? "Мои объявления" : "Менің хабарландыруларым",
    empty: isRu ? "У вас пока нет объявлений" : "Сізде әлі хабарландыру жоқ",
    emptyHint: isRu
      ? "Добавьте первое объявление, и оно появится здесь."
      : "Алғашқы хабарландыруды қосыңыз, ол осында көрінеді.",
    loginHint: isRu
      ? "Войдите через Google, чтобы увидеть свои объявления."
      : "Өз хабарландыруларыңызды көру үшін Google арқылы кіріңіз.",
    pendingHint: isRu
      ? "Ожидает проверки администратора"
      : "Әкімшінің тексеруін күтуде",
    rejectedHint: isRu
      ? "Объявление отклонено администратором"
      : "Әкімші хабарландыруды қабылдамады",
    hiddenHint: isRu
      ? "Скрыто: запрошено удаление аккаунта"
      : "Жасырылған: аккаунтты жою сұралған",
  };

  const statusMap: Record<string, { label: string; color: string }> = {
    active: {
      label: isRu ? "Активно" : "Белсенді",
      color: isDark
        ? "bg-emerald-950/50 text-emerald-300"
        : "bg-emerald-100 text-emerald-700",
    },
    moderation: {
      label: isRu ? "На проверке" : "Модерацияда",
      color: isDark
        ? "bg-amber-950/50 text-amber-300"
        : "bg-amber-100 text-amber-700",
    },
    rejected: {
      label: isRu ? "Отклонено" : "Қабылданбады",
      color: isDark
        ? "bg-red-950/50 text-red-300"
        : "bg-red-100 text-red-700",
    },
    sold: {
      label: isRu ? "Продано" : "Сатылды",
      color: isDark
        ? "bg-blue-950/50 text-blue-300"
        : "bg-blue-100 text-blue-700",
    },
    hidden: {
      label: isRu ? "Скрыто" : "Жасырылған",
      color: isDark
        ? "bg-slate-800 text-slate-300"
        : "bg-slate-200 text-slate-700",
    },
  };

  useEffect(() => {
    let cancelled = false;

    async function loadAds() {
      if (!user) {
        setAds([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setHasError(false);

      try {
        const result = await getAdsByUser(user.uid);
        if (!cancelled) setAds(result);
      } catch (error) {
        console.error("Менің жарнамаларымды жүктеу қатесі:", error);
        if (!cancelled) setHasError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadAds();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const formatPrice = (ad: Ad) => {
    const value = Number(ad.price || 0);
    return value > 0
      ? `${value.toLocaleString(locale)} ₸`
      : t("priceNegotiable");
  };

  const formatDate = (value: unknown) => {
    if (!value || typeof value !== "object") return "";

    const candidate = value as { toDate?: () => Date };
    if (typeof candidate.toDate !== "function") return "";

    const date = candidate.toDate();
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleDateString(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const panelClass = isDark
    ? "border-gray-800 bg-gray-900 text-gray-100"
    : "border-gray-200 bg-white text-gray-900";

  const mutedClass = isDark ? "text-gray-400" : "text-gray-500";

  const emptyBoxClass = isDark
    ? "border-gray-700 bg-gray-900"
    : "border-gray-300 bg-white";

  return (
    <div
      className={`min-h-screen pb-20 ${
        isDark ? "bg-gray-950 text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      <header className={`sticky top-0 z-30 border-b shadow-sm ${panelClass}`}>
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <button
            onClick={() => navigate("/profile")}
            aria-label={t("back")}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
              isDark
                ? "bg-gray-800 text-gray-200 hover:bg-gray-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <h1 className="truncate text-base font-bold">{text.title}</h1>

          <Button
            onClick={() => navigate("/post")}
            size="sm"
            className="shrink-0 gap-1 rounded-xl bg-blue-600 px-3 text-xs text-white hover:bg-blue-700"
          >
            <PlusCircle className="h-4 w-4" />
            <span>{t("add")}</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-3 px-4 py-4">
        {!user ? (
          <div
            className={`rounded-2xl border border-dashed p-6 py-12 text-center ${emptyBoxClass}`}
          >
            <User className="mx-auto mb-2 h-10 w-10 text-gray-400" />
            <p className={`mb-4 text-sm ${mutedClass}`}>{text.loginHint}</p>
            <Button
              onClick={() => setIsLoginOpen(true)}
              className="rounded-xl bg-blue-600 text-white hover:bg-blue-700"
            >
              {t("login")}
            </Button>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-16">
            <Loader2
              className="h-8 w-8 animate-spin text-blue-600"
              aria-label={t("loading")}
            />
          </div>
        ) : hasError ? (
          <div
            className={`rounded-2xl border border-dashed p-6 py-12 text-center ${emptyBoxClass}`}
          >
            <h3 className="text-sm font-semibold">{t("error")}</h3>
          </div>
        ) : ads.length === 0 ? (
          <div
            className={`rounded-2xl border border-dashed p-6 py-12 text-center ${emptyBoxClass}`}
          >
            <Megaphone className="mx-auto mb-2 h-10 w-10 text-gray-400" />
            <h3 className="text-sm font-semibold">{text.empty}</h3>
            <p className={`mt-1 text-xs ${mutedClass}`}>{text.emptyHint}</p>
          </div>
        ) : (
          ads.map((ad) => {
            const image = Array.isArray(ad.images) ? ad.images[0] : undefined;
            const status = statusMap[ad.status] || {
              label: ad.status,
              color: isDark
                ? "bg-gray-800 text-gray-300"
                : "bg-gray-100 text-gray-700",
            };
            const dateLabel = formatDate(ad.createdAt);

            return (
              <Card
                key={ad.id}
                onClick={() => navigate(`/ad/${ad.id}`)}
                className={`cursor-pointer rounded-2xl border p-4 transition-all hover:border-blue-400 ${
                  isDark
                    ? "border-gray-800 bg-gray-900 text-gray-100 hover:bg-gray-800"
                    : "border-gray-200 bg-white text-gray-900"
                }`}
              >
                <div className="flex gap-3">
                  {image ? (
                    <img
                      src={image}
                      alt={ad.title}
                      loading="lazy"
                      className="h-20 w-20 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <div
                      className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-xl ${
                        isDark ? "bg-gray-800" : "bg-gray-100"
                      }`}
                    >
                      <ImageOff className="h-6 w-6 text-gray-400" />
                    </div>
                  )}

                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <h3 className="line-clamp-2 text-sm font-bold">
                      {ad.title}
                    </h3>

                    <div className="text-base font-extrabold text-blue-500">
                      {formatPrice(ad)}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`rounded-md px-2 py-0.5 font-semibold ${status.color}`}
                      >
                        {status.label}
                      </span>

                      {dateLabel && (
                        <span className={mutedClass}>{dateLabel}</span>
                      )}
                    </div>

                    {ad.status === "moderation" && (
                      <p className={`text-xs ${mutedClass}`}>
                        {text.pendingHint}
                      </p>
                    )}

                    {ad.status === "rejected" && (
                      <p className={`text-xs ${mutedClass}`}>
                        {text.rejectedHint}
                      </p>
                    )}

                    {ad.status === "hidden" && (
                      <p className={`text-xs ${mutedClass}`}>
                        {text.hiddenHint}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </main>

      <LoginModal
        open={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />
    </div>
  );
}
