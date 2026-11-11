
import { useEffect, useState } from "react";
import {
  getSiteSettings,
  saveSiteSettings,
  type SiteSettings,
} from "@/lib/firestore";

const defaults: SiteSettings = {
  maintenanceMode: false,
  postingDisabled: false,
  showBanners: true,
  showCategories: true,
  showWeather: true,
  showPrayerTimes: true,
  maxImages: 5,
  requireImage: true,
  requirePhone: false,
  homeTitleKk: "BaixKZ — хабарландырулар",
  homeTitleRu: "BaixKZ — объявления",
  homeDescriptionKk: "Сатып ал, сат және өз қызметіңді ұсын",
  homeDescriptionRu: "Покупай, продавай и предлагай услуги",
  rulesKk: "Ережелерді сақтаңыз.",
  rulesRu: "Соблюдайте правила.",
};

type TextKey =
  | "homeTitleKk"
  | "homeTitleRu"
  | "homeDescriptionKk"
  | "homeDescriptionRu"
  | "maxImages"
  | "rulesKk"
  | "rulesRu";

type ToggleKey =
  | "maintenanceMode"
  | "postingDisabled"
  | "showBanners"
  | "showCategories"
  | "showWeather"
  | "showPrayerTimes"
  | "requireImage"
  | "requirePhone";

export default function SiteSettingsPage() {
  const [data, setData] = useState<SiteSettings>(defaults);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    getSiteSettings()
      .then((value) => {
        if (active) {
          setData({ ...defaults, ...value });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Баптауларды жүктеу қатесі",
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const textField = (key: TextKey, label: string) => (
    <label
      className="block text-sm font-medium"
      key={key}
    >
      {label}
      <input
        className="mt-1 w-full rounded-lg border p-2 text-sm text-slate-900"
        value={String(data[key] ?? "")}
        onChange={(event) => {
          const value =
            key === "maxImages"
              ? Number(event.target.value)
              : event.target.value;

          setData((current) => ({
            ...current,
            [key]: value,
          }));
        }}
      />
    </label>
  );

  const toggleField = (key: ToggleKey, label: string) => (
    <label
      className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"
      key={key}
    >
      <span>{label}</span>
      <input
        type="checkbox"
        checked={Boolean(data[key])}
        onChange={(event) =>
          setData((current) => ({
            ...current,
            [key]: event.target.checked,
          }))
        }
      />
    </label>
  );

  const save = async () => {
    setBusy(true);
    setMessage("");

    try {
      const maxImages = Math.max(
        1,
        Math.min(5, Number(data.maxImages) || 5),
      );

      await saveSiteSettings({
        ...data,
        maxImages,
      });

      setMessage("Баптаулар сәтті сақталды.");
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Сақтау қатесі",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-4 text-slate-900">
      <h2 className="text-xl font-bold">
        Сайт пен басты бет баптаулары
      </h2>

      <div className="grid gap-3 sm:grid-cols-2">
        {textField("homeTitleKk", "Басты тақырып (қазақша)")}
        {textField("homeTitleRu", "Заголовок (русский)")}
        {textField("homeDescriptionKk", "Сипаттама (қазақша)")}
        {textField("homeDescriptionRu", "Описание (русский)")}
        {textField("maxImages", "Сурет саны (1–5)")}
        {textField("rulesKk", "Жариялау ережесі (қазақша)")}
        {textField("rulesRu", "Правила публикации (русский)")}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {toggleField("maintenanceMode", "Техникалық қызмет режимі")}
        {toggleField("postingDisabled", "Жарнама жариялауды тоқтату")}
        {toggleField("showBanners", "Баннерлерді көрсету")}
        {toggleField("showCategories", "Санаттарды көрсету")}
        {toggleField("showWeather", "Ауа райын көрсету")}
        {toggleField("showPrayerTimes", "Намаз уақытын көрсету")}
        {toggleField("requireImage", "Суретті міндетті ету")}
        {toggleField("requirePhone", "Телефонды міндетті ету")}
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={() => void save()}
        className="rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Сақталуда…" : "Баптауларды сақтау"}
      </button>

      {message && (
        <p className="text-sm" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
