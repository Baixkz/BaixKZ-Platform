
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  MapPin,
  Clock,
  Phone,
  Crown,
  ImageOff,
} from "lucide-react";
import { getAdById, createAdReport, type Ad } from "../lib/firestore";
import { useAuth } from "../lib/auth-context";
import { toast } from "sonner";
import { useAppSettings } from "../lib/app-settings";

export default function AdDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language, theme } = useAppSettings();
  const { user } = useAuth();

  const isRu = language === "ru";
  const isDark = theme === "dark";

  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [showPhone, setShowPhone] = useState(false);

  const text = {
    notFound: isRu ? "Объявление не найдено" : "Хабарландыру табылмады",
    otherAds: isRu ? "ДРУГИЕ ОБЪЯВЛЕНИЯ" : "БАСҚА ХАБАРЛАНДЫРУЛАР",
    noImage: isRu ? "Нет изображения" : "Сурет жоқ",
    description: isRu ? "Описание" : "Сипаттамасы",
    noCity: isRu ? "Город не указан" : "Қала көрсетілмеген",
    seller: isRu ? "Продавец" : "Сатушы",
    user: isRu ? "Пользователь" : "Пайдаланушы",
    noPhone: isRu ? "Нет номера" : "Нөмір жоқ",
    showPhone: isRu ? "Показать номер" : "Нөмірді көру",
    loading: isRu ? "Загрузка..." : "Жүктелуде...",
    back: isRu ? "Назад" : "Артқа",
    contact: isRu ? "Написать в WhatsApp" : "WhatsApp арқылы жазу",
  };

  useEffect(() => {
    let cancelled = false;

    async function loadAd() {
      setLoading(true);
      setAd(null);
      setCurrentImage(0);
      setShowPhone(false);

      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const result = await getAdById(id);

        if (!cancelled) {
          setAd(result);
        }
      } catch (error) {
        console.error("Жарнаманы жүктеу қатесі:", error);

        if (!cancelled) {
          setAd(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAd();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const formatDate = (timestamp: unknown) => {
    if (!timestamp) return "";

    try {
      const value = timestamp as {
        toDate?: () => Date;
      };

      const date =
        typeof value.toDate === "function"
          ? value.toDate()
          : new Date(timestamp as string | number | Date);

      if (Number.isNaN(date.getTime())) return "";

      return date.toLocaleDateString(isRu ? "ru-RU" : "kk-KZ", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  const pageClass = isDark
    ? "min-h-screen bg-gray-950 text-gray-100"
    : "min-h-screen bg-[#fcfcfd] text-slate-800";

  const panelClass = isDark
    ? "border-gray-800 bg-gray-900"
    : "border-slate-100 bg-white";

  const mutedClass = isDark ? "text-gray-400" : "text-slate-500";

  if (loading) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center ${pageClass}`}
      >
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
          aria-label={text.loading}
        />
      </div>
    );
  }

  if (!ad) {
    return (
      <div className={`${pageClass} min-h-screen px-4 py-20 text-center`}>
        <p className={`font-bold ${mutedClass}`}>{text.notFound}</p>

        <button
          onClick={() => navigate("/ads")}
          className="mt-4 text-sm font-bold text-blue-500"
        >
          {text.otherAds}
        </button>
      </div>
    );
  }

  const images = Array.isArray(ad.images) ? ad.images : [];
  const phone = ad.phone || ad.ownerPhone || "";
  const sellerName = ad.ownerName || text.user;
  const city = ad.city || text.noCity;

  const price = Number(ad.price || 0).toLocaleString(
    isRu ? "ru-RU" : "kk-KZ",
  );

  const reportAd = async () => {
    if (!user) {
      toast.error(
        isRu
          ? "Войдите, чтобы пожаловаться"
          : "Шағым жіберу үшін аккаунтқа кіріңіз",
      );
      return;
    }

    const reason = window.prompt(
      isRu ? "Причина жалобы" : "Шағым себебі",
    );

    if (!reason?.trim()) return;

    const message =
      window.prompt(
        isRu
          ? "Дополнительные сведения (необязательно)"
          : "Қосымша мәлімет (міндетті емес)",
      ) || "";

    try {
      await createAdReport({
        userId: user.uid,
        adId: ad.id,
        reason: reason.trim(),
        message: message.trim(),
      });

      toast.success(
        isRu ? "Жалоба отправлена" : "Шағым жіберілді",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : isRu
            ? "Не удалось отправить жалобу"
            : "Шағым жіберілмеді",
      );
    }
  };

  return (
    <div className={`${pageClass} mx-auto min-h-screen max-w-lg pb-10`}>
      <div className="relative">
        <button
          onClick={() => navigate(-1)}
          aria-label={text.back}
          className={`absolute left-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-2xl shadow-sm backdrop-blur-md transition ${
            isDark
              ? "bg-gray-900/90 text-white hover:bg-gray-800"
              : "bg-white/90 text-slate-800 hover:bg-white"
          }`}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {images.length > 0 ? (
          <div
            className={`relative aspect-square overflow-hidden rounded-b-[2.5rem] shadow-lg ${
              isDark ? "bg-gray-900" : "bg-slate-100"
            }`}
          >
            <img
              src={images[currentImage]}
              alt={ad.title}
              className="h-full w-full object-cover"
              onError={(event) => {
                event.currentTarget.style.visibility = "hidden";
              }}
            />

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label={isRu ? "Предыдущее фото" : "Алдыңғы сурет"}
                  onClick={() =>
                    setCurrentImage((current) =>
                      current === 0 ? images.length - 1 : current - 1,
                    )
                  }
                  className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  aria-label={isRu ? "Следующее фото" : "Келесі сурет"}
                  onClick={() =>
                    setCurrentImage((current) =>
                      (current + 1) % images.length,
                    )
                  }
                  className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white"
                >
                  <ChevronLeft className="h-5 w-5 rotate-180" />
                </button>

                <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/40 px-3 py-1.5">
                  {images.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      aria-label={
                        isRu
                          ? `Фото ${index + 1}`
                          : `${index + 1}-сурет`
                      }
                      onClick={() => setCurrentImage(index)}
                      className={`h-1.5 rounded-full transition-all ${
                        index === currentImage
                          ? "w-4 bg-white"
                          : "w-1.5 bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            {ad.isVip && (
              <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1.5 text-[10px] font-black text-amber-950 shadow-lg">
                <Crown className="h-3 w-3" />
                VIP
              </div>
            )}
          </div>
        ) : (
          <div
            className={`flex aspect-square items-center justify-center rounded-b-[2.5rem] ${
              isDark ? "bg-gray-900" : "bg-slate-100"
            }`}
          >
            <div className={`flex flex-col items-center gap-2 ${mutedClass}`}>
              <ImageOff className="h-10 w-10" />

              <span className="text-xs font-bold uppercase tracking-widest">
                {text.noImage}
              </span>
            </div>
          </div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-6"
      >
        <div className="mb-4">
          <h1
            className={`mb-2 text-2xl font-black leading-tight ${
              isDark ? "text-gray-100" : "text-slate-800"
            }`}
          >
            {ad.title}
          </h1>

          <p className="text-3xl font-black tracking-tight text-blue-500">
            {price} <span className="text-lg">₸</span>
          </p>
        </div>

        <div
          className={`mb-6 rounded-[1.5rem] border p-5 shadow-sm ${panelClass}`}
        >
          <h2
            className={`mb-3 text-[10px] font-black uppercase tracking-widest ${mutedClass}`}
          >
            {text.description}
          </h2>

          <p
            className={`whitespace-pre-wrap text-sm font-medium leading-relaxed ${
              isDark ? "text-gray-300" : "text-slate-600"
            }`}
          >
            {ad.description ||
              (isRu ? "Описание отсутствует" : "Сипаттама жоқ")}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3">
          <div
            className={`flex items-center gap-3 rounded-2xl border p-4 shadow-sm ${panelClass}`}
          >
            <div
              className={`rounded-xl p-2 ${
                isDark
                  ? "bg-blue-950 text-blue-300"
                  : "bg-blue-50 text-blue-600"
              }`}
            >
              <MapPin className="h-4 w-4" />
            </div>

            <p className="break-words text-xs font-bold">{city}</p>
          </div>

          <div
            className={`flex items-center gap-3 rounded-2xl border p-4 shadow-sm ${panelClass}`}
          >
            <div
              className={`rounded-xl p-2 ${
                isDark
                  ? "bg-gray-800 text-gray-300"
                  : "bg-slate-50 text-slate-500"
              }`}
            >
              <Clock className="h-4 w-4" />
            </div>

            <p className={`text-[10px] font-bold ${mutedClass}`}>
              {formatDate(ad.createdAt)}
            </p>
          </div>
        </div>

        <div
          className={`mb-8 flex items-center justify-between gap-3 rounded-[1.5rem] border p-4 shadow-sm ${panelClass}`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
              <span className="text-lg font-black text-white">
                {sellerName.charAt(0).toLocaleUpperCase()}
              </span>
            </div>

            <div className="min-w-0">
              <p className="break-words text-sm font-black">
                {sellerName}
              </p>

              <p
                className={`text-[10px] font-bold uppercase tracking-wider ${mutedClass}`}
              >
                {text.seller}
              </p>
            </div>
          </div>
        </div>

        {user && user.uid !== ad.userId && (
          <button
            type="button"
            onClick={() => void reportAd()}
            className="mb-3 w-full rounded-xl border border-red-300 py-3 text-sm font-semibold text-red-600"
          >
            {isRu
              ? "Пожаловаться на объявление"
              : "Хабарландыруға шағымдану"}
          </button>
        )}

        <button
          onClick={() => setShowPhone((current) => !current)}
          className="flex w-full items-center justify-center gap-3 rounded-[1.5rem] bg-blue-600 py-5 text-sm font-black uppercase tracking-wider text-white shadow-xl transition-all hover:bg-blue-700 active:scale-[0.98]"
        >
          <Phone className="h-5 w-5" />
          {showPhone ? phone || text.noPhone : text.showPhone}
        </button>

        {showPhone && phone && (
          <a
            href={`https://wa.me/${phone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex w-full items-center justify-center rounded-[1.5rem] bg-emerald-600 py-4 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
          >
            {text.contact}
          </a>
        )}
      </motion.div>
    </div>
  );
}
