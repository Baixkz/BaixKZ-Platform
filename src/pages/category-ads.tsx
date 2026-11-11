
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  PlusCircle,
  Phone,
  MapPin,
  Filter,
  Tag,
  ShoppingBag,
  HandCoins,
  LayoutGrid,
  ImageOff,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAppSettings } from "@/lib/app-settings";
import { getAds, getAllCategories } from "@/lib/firestore";
import type { Ad, AdType, Category } from "@/types";

type AdTypeFilter = "all" | AdType;

function toMillis(value: unknown): number {
  if (!value || typeof value !== "object") return 0;

  const candidate = value as { toDate?: () => Date };

  if (typeof candidate.toDate !== "function") return 0;

  const time = candidate.toDate().getTime();
  return Number.isNaN(time) ? 0 : time;
}

export default function CategoryAds() {
  const navigate = useNavigate();
  const { language, theme, t } = useAppSettings();

  const isDark = theme === "dark";
  const isRu = language === "ru";
  const locale = isRu ? "ru-RU" : "kk-KZ";

  const [ads, setAds] = useState<Ad[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const [typeFilter, setTypeFilter] = useState<AdTypeFilter>("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const text = {
    searchAll: isRu
      ? "Поиск объявлений..."
      : "Хабарландыруларды іздеу...",
  };

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setHasError(false);

      try {
        const [adsResult, categoriesResult] = await Promise.all([
          getAds("active"),
          getAllCategories(),
        ]);

        if (!cancelled) {
          setAds(adsResult);
          setCategories(categoriesResult);
        }
      } catch (error) {
        console.error("Хабарландыруларды жүктеу қатесі:", error);

        if (!cancelled) {
          setHasError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const rootCategories = useMemo(
    () =>
      categories
        .filter(
          (category) =>
            !category.parentId && category.active !== false,
        )
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [categories],
  );

  const categoryNames = useMemo(
    () =>
      new Map(
        categories.map((category) => [
          category.id,
          (isRu ? category.nameRu : category.nameKk) || category.name,
        ]),
      ),
    [categories, isRu],
  );

  const normalizedSearch = searchQuery
    .trim()
    .toLocaleLowerCase();

  const visibleAds = useMemo(() => {
    return ads
      .filter((ad) => {
        const matchesType =
          typeFilter === "all" ||
          (ad.adType ?? "sell") === typeFilter;

        const matchesCategory =
          selectedCategory === "all" ||
          (Array.isArray(ad.categoryPath) &&
            ad.categoryPath.includes(selectedCategory));

        const matchesSearch =
          !normalizedSearch ||
          [ad.title, ad.description, ad.city]
            .join(" ")
            .toLocaleLowerCase()
            .includes(normalizedSearch);

        return matchesType && matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        const vipDifference =
          Number(b.isVip === true) - Number(a.isVip === true);

        if (vipDifference !== 0) return vipDifference;

        return toMillis(b.createdAt) - toMillis(a.createdAt);
      });
  }, [ads, typeFilter, selectedCategory, normalizedSearch]);

  const formatPrice = (ad: Ad) => {
    const value = Number(ad.price || 0);

    return value > 0
      ? `${value.toLocaleString(locale)} ₸`
      : t("priceNegotiable");
  };

  const formatDate = (value: unknown) => {
    const time = toMillis(value);

    if (!time) return "";

    return new Date(time).toLocaleDateString(locale, {
      day: "numeric",
      month: "long",
    });
  };

  const typeTabs: {
    value: AdTypeFilter;
    label: string;
    icon: typeof LayoutGrid;
  }[] = [
    { value: "all", label: t("all"), icon: LayoutGrid },
    { value: "sell", label: t("sell"), icon: ShoppingBag },
    { value: "buy", label: t("buy"), icon: HandCoins },
  ];

  const searchPlaceholder =
    typeFilter === "sell"
      ? t("searchSell")
      : typeFilter === "buy"
        ? t("searchBuy")
        : text.searchAll;

  const panelClass = isDark
    ? "border-gray-800 bg-gray-900 text-gray-100"
    : "border-gray-200 bg-white text-gray-900";

  const mutedClass = isDark
    ? "text-gray-400"
    : "text-gray-500";

  const inputClass = isDark
    ? "border-gray-700 bg-gray-800 text-gray-100 placeholder:text-gray-400"
    : "border-gray-200 bg-gray-50 text-gray-900";

  const inactiveTabClass = isDark
    ? "text-gray-300 hover:text-white"
    : "text-gray-600 hover:text-gray-900";

  return (
    <div
      className={`min-h-screen pb-20 ${
        isDark
          ? "bg-gray-950 text-gray-100"
          : "bg-gray-50 text-gray-900"
      }`}
    >
      <header
        className={`sticky top-0 z-30 border-b shadow-sm ${panelClass}`}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <button
            onClick={() => navigate("/")}
            aria-label={t("back")}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
              isDark
                ? "bg-gray-800 text-gray-200 hover:bg-gray-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <h1 className="truncate text-base font-bold">
            {t("adTitle")}
          </h1>

          <Button
            onClick={() => navigate("/post")}
            size="sm"
            className="shrink-0 gap-1 rounded-xl bg-blue-600 px-3 text-xs text-white hover:bg-blue-700"
          >
            <PlusCircle className="h-4 w-4" />
            <span>{t("add")}</span>
          </Button>
        </div>

        <div className="mx-auto max-w-4xl px-4 pb-3">
          <div
            className={`grid grid-cols-3 gap-2 rounded-xl p-1 ${
              isDark ? "bg-gray-800" : "bg-gray-100"
            }`}
          >
            {typeTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = typeFilter === tab.value;

              return (
                <button
                  key={tab.value}
                  onClick={() => setTypeFilter(tab.value)}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-all ${
                    isActive
                      ? isDark
                        ? "bg-gray-700 text-blue-300 shadow-sm"
                        : "bg-white text-blue-600 shadow-sm"
                      : inactiveTabClass
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className={`rounded-xl pl-9 pr-4 focus-visible:ring-blue-600 ${inputClass}`}
            />
          </div>
        </div>
      </header>

      <div
        className={`no-scrollbar overflow-x-auto border-b px-4 py-2 ${
          isDark
            ? "border-gray-800 bg-gray-900"
            : "border-gray-200 bg-white"
        }`}
      >
        <div className="mx-auto flex max-w-4xl items-center gap-2">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              selectedCategory === "all"
                ? "bg-blue-600 text-white"
                : isDark
                  ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {t("all")}
          </button>

          {rootCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                selectedCategory === category.id
                  ? "bg-blue-600 text-white"
                  : isDark
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {(isRu ? category.nameRu : category.nameKk) ||
                category.name}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-4xl space-y-3 px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2
              className="h-8 w-8 animate-spin text-blue-600"
              aria-label={t("loading")}
            />
          </div>
        ) : hasError ? (
          <div
            className={`rounded-2xl border border-dashed p-6 py-12 text-center ${
              isDark
                ? "border-gray-700 bg-gray-900"
                : "border-gray-300 bg-white"
            }`}
          >
            <h3 className="text-sm font-semibold">{t("error")}</h3>
          </div>
        ) : visibleAds.length === 0 ? (
          <div
            className={`rounded-2xl border border-dashed p-6 py-12 text-center ${
              isDark
                ? "border-gray-700 bg-gray-900"
                : "border-gray-300 bg-white"
            }`}
          >
            <Filter className="mx-auto mb-2 h-10 w-10 text-gray-400" />
            <h3 className="text-sm font-semibold">
              {t("noResults")}
            </h3>
            <p className={`mt-1 text-xs ${mutedClass}`}>
              {t("changeSearch")}
            </p>
          </div>
        ) : (
          visibleAds.map((ad) => {
            const image = Array.isArray(ad.images)
              ? ad.images[0]
              : undefined;

            const lastCategoryId = Array.isArray(ad.categoryPath)
              ? ad.categoryPath[ad.categoryPath.length - 1]
              : undefined;

            const categoryName = lastCategoryId
              ? categoryNames.get(lastCategoryId)
              : undefined;

            const isBuy = (ad.adType ?? "sell") === "buy";

            const whatsappNumber = (
              ad.phone ||
              ad.ownerPhone ||
              ""
            ).replace(/\D/g, "");

            return (
              <Card
                key={ad.id}
                onClick={() => navigate(`/ad/${ad.id}`)}
                className={`relative cursor-pointer rounded-2xl border p-4 transition-all hover:border-blue-400 ${
                  isDark
                    ? "border-gray-800 bg-gray-900 text-gray-100 hover:bg-gray-800"
                    : "border-gray-200 bg-white text-gray-900"
                } ${
                  ad.isVip
                    ? isDark
                      ? "border-amber-700 bg-amber-950/20"
                      : "border-amber-300 bg-amber-50/30"
                    : ""
                }`}
              >
                {ad.isVip && (
                  <span className="absolute right-3 top-3 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    {t("topAd")}
                  </span>
                )}

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
                    <h3
                      className={`line-clamp-2 text-sm font-bold ${
                        ad.isVip ? "pr-16" : ""
                      }`}
                    >
                      {ad.title}
                    </h3>

                    <div className="text-base font-extrabold text-blue-500">
                      {formatPrice(ad)}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`rounded-md px-2 py-0.5 font-semibold ${
                          isBuy
                            ? isDark
                              ? "bg-purple-950/50 text-purple-300"
                              : "bg-purple-50 text-purple-700"
                            : isDark
                              ? "bg-emerald-950/50 text-emerald-300"
                              : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {isBuy ? t("buy") : t("sell")}
                      </span>

                      {categoryName && (
                        <span
                          className={`flex items-center gap-1 rounded-md px-2 py-0.5 font-medium ${
                            isDark
                              ? "bg-gray-800 text-gray-300"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          <Tag className="h-3 w-3 text-gray-400" />
                          {categoryName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className={`mt-3 flex flex-wrap items-center gap-3 border-t pt-2 text-xs ${
                    isDark ? "border-gray-700" : "border-gray-100"
                  }`}
                >
                  {ad.city && (
                    <span
                      className={`flex items-center gap-1 ${mutedClass}`}
                    >
                      <MapPin className="h-3 w-3" />
                      {ad.city}
                    </span>
                  )}

                  <span className={`ml-auto text-[11px] ${mutedClass}`}>
                    {formatDate(ad.createdAt)}
                  </span>
                </div>

                {whatsappNumber && (
                  <div className="flex items-center justify-between pt-2">
                    <a
                      href={`https://wa.me/${whatsappNumber}`}
                      onClick={(event) => event.stopPropagation()}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        isDark
                          ? "border-emerald-800 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span>
                        {isRu
                          ? "Написать в WhatsApp"
                          : "WhatsApp жазу"}
                      </span>
                    </a>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </main>
    </div>
  );
}
