
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Sun,
  CloudSun,
  Search,
  ShoppingBag,
  Store,
  Briefcase,
  Car,
  Utensils,
  Wrench,
  Activity,
  Building2,
  Gamepad2,
  ChevronDown,
  X,
  CalendarDays,
  Clock3,
  Sunrise,
  Sunset,
  Moon,
  Loader2,
  LocateFixed,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { BannerCarousel } from "@/components/banner-carousel";
import {
  getBanners,
  getSiteSettings,
  getPublicNotifications,
  type Banner,
  type SiteSettings,
} from "@/lib/firestore";
import { useAppSettings } from "@/lib/app-settings";

type Place = {
  id: number;
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  admin2?: string;
};

type WeatherData = {
  temperature: number;
  apparentTemperature: number;
  weatherCode: number;
};

type PrayerData = {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  hijriDate?: string;
};

const PLACE_STORAGE_KEY = "baixkz-selected-place";

const DEFAULT_PLACE: Place = {
  id: 0,
  name: "Түймекент ауылы",
  displayName: "Қазақстан, Жамбыл облысы, Байзақ ауданы, Түймекент ауылы",
  latitude: 43.02,
  longitude: 71.75,
  country: "Қазақстан",
  admin1: "Жамбыл облысы",
  admin2: "Байзақ ауданы",
};

const MAIN_SECTIONS = [
  {
    key: "ads",
    titleKk: "Хабарландырулар",
    titleRu: "Объявления",
    descKk: "Сатамын және сатып аламын",
    descRu: "Продажа и покупка",
    icon: ShoppingBag,
    path: "/ads",
  },
  {
    key: "stores",
    titleKk: "Дүкендер",
    titleRu: "Магазины",
    descKk: "Жергілікті дүкендер",
    descRu: "Местные магазины",
    icon: Store,
    path: "/stores",
  },
  {
    key: "jobs",
    titleKk: "Жұмыс",
    titleRu: "Работа",
    descKk: "Бос орындар мен резюме",
    descRu: "Вакансии и резюме",
    icon: Briefcase,
    path: "/jobs",
  },
  {
    key: "transport",
    titleKk: "Көлік және такси",
    titleRu: "Транспорт и такси",
    descKk: "Жергілікті тасымал және авто",
    descRu: "Перевозки и автомобили",
    icon: Car,
    path: "/transport",
  },
  {
    key: "food",
    titleKk: "Тамақтану",
    titleRu: "Питание",
    descKk: "Асханалар мен кафелер",
    descRu: "Столовые и кафе",
    icon: Utensils,
    path: "/food",
  },
  {
    key: "services",
    titleKk: "Қызмет көрсету",
    titleRu: "Услуги",
    descKk: "Тұрмыстық және техникалық қызмет",
    descRu: "Бытовые и технические услуги",
    icon: Wrench,
    path: "/services",
  },
  {
    key: "medical",
    titleKk: "Медицина",
    titleRu: "Медицина",
    descKk: "Дәріханалар мен амбулаториялар",
    descRu: "Аптеки и амбулатории",
    icon: Activity,
    path: "/medical",
  },
  {
    key: "institutions",
    titleKk: "Мекемелер",
    titleRu: "Учреждения",
    descKk: "Мектеп, әкімдік, пошта",
    descRu: "Школы, акимат, почта",
    icon: Building2,
    path: "/institutions",
  },
  {
    key: "entertainment",
    titleKk: "Ойын-сауық",
    titleRu: "Развлечения",
    descKk: "Іс-шаралар мен спорт",
    descRu: "Мероприятия и спорт",
    icon: Gamepad2,
    path: "/entertainment",
  },
];

function getWeatherDescription(code: number, kk: boolean) {
  if (code === 0) return kk ? "Ашық" : "Ясно";
  if ([1, 2].includes(code)) return kk ? "Аз бұлтты" : "Переменная облачность";
  if (code === 3) return kk ? "Бұлтты" : "Облачно";
  if ([45, 48].includes(code)) return kk ? "Тұман" : "Туман";
  if ([51, 53, 55, 56, 57].includes(code)) return kk ? "Сіркіреме жаңбыр" : "Морось";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return kk ? "Жаңбыр" : "Дождь";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return kk ? "Қар" : "Снег";
  if ([95, 96, 99].includes(code)) return kk ? "Найзағай" : "Гроза";
  return kk ? "Ауа райы" : "Погода";
}

function formatTime(value?: string) {
  if (!value) return "--:--";
  return value.slice(0, 5);
}

function getStoredPlace(): Place {
  try {
    const saved = localStorage.getItem(PLACE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Place;
      if (
        typeof parsed.latitude === "number" &&
        typeof parsed.longitude === "number" &&
        parsed.displayName
      ) {
        return parsed;
      }
    }
  } catch {
    // Сақталған мекен оқылмаса, әдепкі мекен қолданылады.
  }

  return DEFAULT_PLACE;
}

export default function Home() {
  const navigate = useNavigate();
  const { language, theme } = useAppSettings();

  const kk = language === "kk";
  const dark = theme === "dark";

  const [place, setPlace] = useState<Place>(getStoredPlace);
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState<Place[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [now, setNow] = useState(new Date());
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(false);

  const [prayers, setPrayers] = useState<PrayerData | null>(null);
  const [prayerLoading, setPrayerLoading] = useState(false);
  const [prayerError, setPrayerError] = useState(false);

  const [banners, setBanners] = useState<Banner[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({});
  const [notifications, setNotifications] = useState<
    Array<Record<string, any> & { id: string }>
  >([]);

  useEffect(() => {
    void getSiteSettings().then(setSiteSettings).catch(console.error);
    void getPublicNotifications().then(setNotifications).catch(console.error);
  }, []);

  const pageClass = dark
    ? "min-h-screen bg-slate-950 text-white"
    : "min-h-screen bg-slate-50 text-slate-900";

  const cardClass = dark
    ? "border-slate-800 bg-slate-900"
    : "border-slate-200 bg-white";

  const mutedClass = dark ? "text-slate-400" : "text-slate-500";
  const borderClass = dark ? "border-slate-800" : "border-slate-200";

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat(kk ? "kk-KZ" : "ru-RU", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(now),
    [kk, now],
  );

  const loadBanners = useCallback(async () => {
    try {
      const allBanners = await getBanners();
      setBanners(
        allBanners
          .filter((banner) => banner.active && banner.page === "home")
          .sort((a, b) => a.order - b.order),
      );
    } catch (error) {
      console.error("Баннерлерді жүктеу қатесі:", error);
      setBanners([]);
    }
  }, []);

  useEffect(() => {
    void loadBanners();
  }, [loadBanners]);

  useEffect(() => {
    let cancelled = false;

    async function loadWeather() {
      setWeatherLoading(true);
      setWeatherError(false);

      try {
        const params = new URLSearchParams({
          latitude: String(place.latitude),
          longitude: String(place.longitude),
          current: "temperature_2m,apparent_temperature,weather_code",
          timezone: "auto",
        });

        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
        );

        if (!response.ok) throw new Error("Weather request failed");

        const data = await response.json();

        if (cancelled) return;

        setWeather({
          temperature: Math.round(data.current.temperature_2m),
          apparentTemperature: Math.round(data.current.apparent_temperature),
          weatherCode: data.current.weather_code,
        });
      } catch (error) {
        if (!cancelled) {
          setWeather(null);
          setWeatherError(true);
        }
        console.error("Ауа райын жүктеу қатесі:", error);
      } finally {
        if (!cancelled) setWeatherLoading(false);
      }
    }

    void loadWeather();

    return () => {
      cancelled = true;
    };
  }, [place.latitude, place.longitude]);

  useEffect(() => {
    let cancelled = false;

    async function loadPrayerTimes() {
      setPrayerLoading(true);
      setPrayerError(false);

      try {
        const date = new Date();
        const dateString = [
          String(date.getDate()).padStart(2, "0"),
          String(date.getMonth() + 1).padStart(2, "0"),
          date.getFullYear(),
        ].join("-");

        const params = new URLSearchParams({
          latitude: String(place.latitude),
          longitude: String(place.longitude),
          method: "3",
        });

        const response = await fetch(
          `https://api.aladhan.com/v1/timings/${dateString}?${params.toString()}`,
        );

        if (!response.ok) throw new Error("Prayer times request failed");

        const result = await response.json();
        if (result.code !== 200) throw new Error("Prayer times unavailable");

        const data = result.data;

        if (cancelled) return;

        setPrayers({
          fajr: data.timings.Fajr,
          sunrise: data.timings.Sunrise,
          dhuhr: data.timings.Dhuhr,
          asr: data.timings.Asr,
          maghrib: data.timings.Maghrib,
          isha: data.timings.Isha,
          hijriDate: data.date?.hijri?.date,
        });
      } catch (error) {
        if (!cancelled) {
          setPrayers(null);
          setPrayerError(true);
        }
        console.error("Намаз уақыттарын жүктеу қатесі:", error);
      } finally {
        if (!cancelled) setPrayerLoading(false);
      }
    }

    void loadPrayerTimes();

    return () => {
      cancelled = true;
    };
  }, [place.latitude, place.longitude, now.getDate()]);

  const searchLocations = async () => {
    const query = locationQuery.trim();

    if (query.length < 2) {
      setLocationError(
        kk
          ? "Елді мекен атауын кемінде 2 таңбамен енгізіңіз."
          : "Введите не менее 2 символов названия населённого пункта.",
      );
      return;
    }

    setLocationLoading(true);
    setLocationError("");
    setLocationResults([]);

    try {
      const params = new URLSearchParams({
        name: query,
        count: "15",
        language: kk ? "kk" : "ru",
        format: "json",
      });

      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`,
      );

      if (!response.ok) throw new Error("Location search failed");

      const data = await response.json();

      const results: Place[] = (data.results || [])
        .filter((item: any) => item.country_code === "KZ")
        .map((item: any) => {
          const parts = [
            "Қазақстан",
            item.admin1,
            item.admin2,
            item.name,
          ].filter(Boolean);

          return {
            id: item.id,
            name: item.name,
            displayName: [...new Set(parts)].join(", "),
            latitude: item.latitude,
            longitude: item.longitude,
            country: item.country,
            admin1: item.admin1,
            admin2: item.admin2,
          };
        });

      setLocationResults(results);

      if (results.length === 0) {
        setLocationError(
          kk
            ? "Қазақстаннан мекен табылмады. Басқа атаумен іздеп көріңіз."
            : "Населённый пункт в Казахстане не найден. Попробуйте другое название.",
        );
      }
    } catch (error) {
      console.error("Елді мекенді іздеу қатесі:", error);
      setLocationError(
        kk
          ? "Мекенді іздеу мүмкін болмады. Интернет байланысын тексеріңіз."
          : "Не удалось найти населённый пункт. Проверьте интернет.",
      );
    } finally {
      setLocationLoading(false);
    }
  };

  const choosePlace = (nextPlace: Place) => {
    setPlace(nextPlace);

    try {
      localStorage.setItem(PLACE_STORAGE_KEY, JSON.stringify(nextPlace));
    } catch (error) {
      console.error("Мекенді сақтау қатесі:", error);
    }

    setLocationOpen(false);
    setLocationQuery("");
    setLocationResults([]);
    setLocationError("");
  };

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();

    if (!query) {
      navigate("/ads");
      return;
    }

    navigate(`/ads?search=${encodeURIComponent(query)}`);
  };

  const prayerItems = prayers
    ? [
        {
          key: "fajr",
          kk: "Таң",
          ru: "Фаджр",
          time: prayers.fajr,
          icon: Sunrise,
        },
        {
          key: "sunrise",
          kk: "Күн шығуы",
          ru: "Восход",
          time: prayers.sunrise,
          icon: Sun,
        },
        {
          key: "dhuhr",
          kk: "Бесін",
          ru: "Зухр",
          time: prayers.dhuhr,
          icon: Sun,
        },
        {
          key: "asr",
          kk: "Екінті",
          ru: "Аср",
          time: prayers.asr,
          icon: CloudSun,
        },
        {
          key: "maghrib",
          kk: "Ақшам",
          ru: "Магриб",
          time: prayers.maghrib,
          icon: Sunset,
        },
        {
          key: "isha",
          kk: "Құптан",
          ru: "Иша",
          time: prayers.isha,
          icon: Moon,
        },
      ]
    : [];

  return (
    <div className={`${pageClass} pb-24 transition-colors`}>
      <header
        className={`sticky top-0 z-30 border-b shadow-sm ${
          dark
            ? "border-slate-800 bg-slate-950/95"
            : "border-slate-200 bg-white/95"
        } backdrop-blur`}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => setLocationOpen(true)}
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
          >
            <MapPin className="h-5 w-5 shrink-0 text-blue-500" />
            <span className="min-w-0">
              <span className={`block text-xs ${mutedClass}`}>
                {kk ? "Елді мекен" : "Населённый пункт"}
              </span>
              <span className="block truncate text-sm font-bold">
                {place.displayName}
              </span>
            </span>
            <ChevronDown className={`h-4 w-4 shrink-0 ${mutedClass}`} />
          </button>

          <div
            className={`shrink-0 rounded-2xl px-3 py-2 text-right ${
              dark ? "bg-slate-900" : "bg-slate-100"
            }`}
          >
            <div className="flex items-center justify-end gap-1.5">
              <Clock3 className="h-4 w-4 text-blue-500" />
              <span className="font-mono text-sm font-black tabular-nums">
                {now.toLocaleTimeString(kk ? "kk-KZ" : "ru-RU", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </div>
            <div className={`mt-1 text-[10px] capitalize ${mutedClass}`}>
              {formattedDate}
            </div>
          </div>
        </div>

        <form onSubmit={submitSearch} className="mx-auto max-w-4xl px-4 pb-3">
          <div className="relative">
            <Search
              className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${mutedClass}`}
            />
            <Input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={
                kk
                  ? "Тауар, дүкен, жұмыс немесе қызмет іздеу..."
                  : "Поиск товаров, магазинов, работы или услуг..."
              }
              className={`h-11 rounded-2xl pl-9 ${
                dark
                  ? "border-slate-700 bg-slate-900 text-white placeholder:text-slate-500"
                  : "bg-slate-50"
              }`}
            />
            <button
              type="submit"
              aria-label={kk ? "Іздеу" : "Поиск"}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white"
            >
              {kk ? "Іздеу" : "Найти"}
            </button>
          </div>
        </form>
      </header>

      <main className="mx-auto max-w-4xl space-y-5 px-4 py-5">
        {notifications.length > 0 && (
          <section
            aria-label={kk ? "Жүйелік хабарламалар" : "Системные уведомления"}
            className="space-y-2"
          >
            {notifications.map((notification) => (
              <article
                key={notification.id}
                className="rounded-2xl border border-blue-200 bg-blue-50 p-3 text-blue-950"
              >
                <h2 className="text-sm font-bold">{notification.title}</h2>
                <p className="mt-1 whitespace-pre-wrap text-sm">
                  {notification.body}
                </p>
              </article>
            ))}
          </section>
        )}

        {siteSettings.maintenanceMode && (
          <div
            role="status"
            className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-900"
          >
            {kk
              ? "Сайт техникалық қызмет режимінде. Кейбір мүмкіндіктер уақытша шектелуі мүмкін."
              : "Сайт находится на техническом обслуживании. Некоторые функции временно ограничены."}
          </div>
        )}

        <section className="rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-700 p-5 text-white shadow-md">
          <span className="mb-2 inline-block rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold">
            BAIXKZ
          </span>
          <h1 className="text-xl font-black">
            {(kk ? siteSettings.homeTitleKk : siteSettings.homeTitleRu) ||
              (kk
                ? "Өз ауылыңның цифрлық орталығы"
                : "Цифровой центр вашего населённого пункта")}
          </h1>
          <p className="mt-2 text-sm leading-6 text-blue-100">
            {(kk
              ? siteSettings.homeDescriptionKk
              : siteSettings.homeDescriptionRu) ||
              (kk
                ? "Хабарландырулар, жергілікті дүкендер мен қызметтер — бір қосымшада."
                : "Объявления, местные магазины и услуги — в одном приложении.")}
          </p>
        </section>

        {siteSettings.showWeather !== false && (
          <section className={`rounded-3xl border p-4 ${cardClass}`}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sun className="h-5 w-5 text-amber-500" />
                <h2 className="font-extrabold">
                  {kk ? "Ауа райы" : "Погода"}
                </h2>
              </div>
              <span className={`text-xs ${mutedClass}`}>{place.name}</span>
            </div>

            {weatherLoading ? (
              <div
                className={`flex items-center gap-2 py-3 text-sm ${mutedClass}`}
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                {kk ? "Ауа райы жүктелуде..." : "Загрузка погоды..."}
              </div>
            ) : weather ? (
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10">
                  <CloudSun className="h-9 w-9 text-amber-500" />
                </div>
                <div>
                  <div className="text-3xl font-black">
                    {weather.temperature > 0 ? "+" : ""}
                    {weather.temperature}°C
                  </div>
                  <div className={`mt-1 text-sm ${mutedClass}`}>
                    {getWeatherDescription(weather.weatherCode, kk)}
                  </div>
                  <div className={`mt-1 text-xs ${mutedClass}`}>
                    {kk ? "Сезіледі:" : "Ощущается:"}{" "}
                    {weather.apparentTemperature}°C
                  </div>
                </div>
              </div>
            ) : (
              <div className={`flex items-center gap-2 py-2 text-sm ${mutedClass}`}>
                <AlertCircle className="h-4 w-4" />
                {weatherError
                  ? kk
                    ? "Ауа райы дерегін алу мүмкін болмады."
                    : "Не удалось получить данные о погоде."
                  : kk
                    ? "Ауа райы қолжетімсіз."
                    : "Погода недоступна."}
              </div>
            )}
          </section>
        )}

        {siteSettings.showPrayerTimes !== false && (
          <section className={`rounded-3xl border p-4 ${cardClass}`}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-emerald-500" />
                <h2 className="font-extrabold">
                  {kk ? "Намаз уақыттары" : "Время намаза"}
                </h2>
              </div>
              {prayers?.hijriDate && (
                <span className={`text-xs ${mutedClass}`}>
                  {kk ? "Хижри:" : "Хиджра:"} {prayers.hijriDate}
                </span>
              )}
            </div>

            <p className={`mb-4 text-xs ${mutedClass}`}>
              {place.displayName}
            </p>

            {prayerLoading ? (
              <div className={`flex items-center gap-2 py-5 text-sm ${mutedClass}`}>
                <Loader2 className="h-4 w-4 animate-spin" />
                {kk
                  ? "Намаз уақыттары жүктелуде..."
                  : "Загрузка времени намаза..."}
              </div>
            ) : prayers ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {prayerItems.map((item) => {
                  const PrayerIcon = item.icon;
                  return (
                    <div
                      key={item.key}
                      className={`rounded-2xl px-2 py-3 text-center ${
                        dark ? "bg-slate-800" : "bg-slate-50"
                      }`}
                    >
                      <PrayerIcon className="mx-auto mb-2 h-4 w-4 text-emerald-500" />
                      <div className={`text-xs ${mutedClass}`}>
                        {kk ? item.kk : item.ru}
                      </div>
                      <div className="mt-1 font-mono text-sm font-black tabular-nums">
                        {formatTime(item.time)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={`rounded-2xl p-3 text-sm ${mutedClass}`}>
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    {prayerError
                      ? kk
                        ? "Намаз уақыттарын жүктеу мүмкін болмады. Кейбір ауылдар үшін есептелген уақыт жергілікті мешіт кестесінен өзгеше болуы мүмкін."
                        : "Не удалось загрузить время намаза. Для некоторых сёл расчётное время может отличаться от расписания местной мечети."
                      : kk
                        ? "Намаз уақыттары қолжетімсіз."
                        : "Время намаза недоступно."}
                  </span>
                </div>
              </div>
            )}

            <p className={`mt-3 text-[11px] leading-5 ${mutedClass}`}>
              {kk
                ? "Ескерту: намаз уақыттары координат бойынша есептеледі. Ауылдағы нақты кестені жергілікті мешіттен тексеріңіз."
                : "Примечание: время намаза рассчитывается по координатам. Точное расписание для села уточняйте в местной мечети."}
            </p>
          </section>
        )}

        {siteSettings.showBanners !== false && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-extrabold">
                {kk ? "Жарнамалық баннерлер" : "Рекламные баннеры"}
              </h2>
              <span className={`text-xs ${mutedClass}`}>
                {kk ? "Жарнама" : "Реклама"}
              </span>
            </div>

            {banners.length > 0 ? (
              <BannerCarousel banners={banners} />
            ) : (
              <div
                className={`flex min-h-24 items-center justify-center rounded-2xl border border-dashed px-4 py-6 text-center ${borderClass} ${mutedClass}`}
              >
                <div>
                  <ShoppingBag className="mx-auto mb-2 h-6 w-6 opacity-60" />
                  <p className="text-sm">
                    {kk
                      ? "Қазір белсенді жарнамалық баннер жоқ."
                      : "Сейчас нет активных рекламных баннеров."}
                  </p>
                </div>
              </div>
            )}
          </section>
        )}

        {siteSettings.showCategories !== false && (
          <section>
            <h2 className="mb-3 font-extrabold">
              {kk ? "Негізгі бөлімдер" : "Основные разделы"}
            </h2>

            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              {MAIN_SECTIONS.map((section) => {
                const SectionIcon = section.icon;

                return (
                  <button
                    key={section.key}
                    type="button"
                    onClick={() => navigate(section.path)}
                    className={`flex min-w-0 flex-col items-center rounded-2xl border p-3 text-center transition active:scale-[0.98] ${cardClass} ${
                      dark ? "hover:border-blue-500" : "hover:border-blue-300"
                    }`}
                  >
                    <div
                      className={`mb-2 flex h-11 w-11 items-center justify-center rounded-2xl ${
                        dark
                          ? "bg-blue-500/15 text-blue-400"
                          : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      <SectionIcon className="h-5 w-5" />
                    </div>
                    <span className="line-clamp-2 text-xs font-extrabold leading-4">
                      {kk ? section.titleKk : section.titleRu}
                    </span>
                    <span className={`mt-1 line-clamp-2 text-[10px] leading-4 ${mutedClass}`}>
                      {kk ? section.descKk : section.descRu}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {locationOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
          onClick={() => setLocationOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="location-heading"
            className={`max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-3xl p-5 shadow-2xl sm:rounded-3xl ${
              dark ? "bg-slate-900 text-white" : "bg-white text-slate-900"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 id="location-heading" className="text-lg font-black">
                  {kk
                    ? "Елді мекенді таңдаңыз"
                    : "Выберите населённый пункт"}
                </h2>
                <p className={`mt-1 text-xs ${mutedClass}`}>
                  {kk ? "Қазақстан бойынша іздеу" : "Поиск по Казахстану"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLocationOpen(false)}
                aria-label={kk ? "Жабу" : "Закрыть"}
                className={`rounded-xl p-2 ${dark ? "bg-slate-800" : "bg-slate-100"}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void searchLocations();
              }}
              className="mb-4 flex gap-2"
            >
              <Input
                autoFocus
                value={locationQuery}
                onChange={(event) => setLocationQuery(event.target.value)}
                placeholder={
                  kk
                    ? "Ауыл, қала немесе аудан атауы..."
                    : "Название села, города или района..."
                }
                className={`h-11 min-w-0 flex-1 rounded-xl ${
                  dark ? "border-slate-700 bg-slate-800 text-white" : ""
                }`}
              />
              <button
                type="submit"
                disabled={locationLoading}
                className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white disabled:opacity-60"
              >
                {locationLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                {kk ? "Іздеу" : "Найти"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => choosePlace(DEFAULT_PLACE)}
              className={`mb-3 flex w-full items-center gap-3 rounded-2xl border p-3 text-left ${cardClass}`}
            >
              <LocateFixed className="h-5 w-5 shrink-0 text-blue-500" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">
                  {kk
                    ? "Әдепкі елді мекен"
                    : "Населённый пункт по умолчанию"}
                </span>
                <span className={`mt-1 block text-xs ${mutedClass}`}>
                  {DEFAULT_PLACE.displayName}
                </span>
              </span>
            </button>

            {locationError && (
              <p className="mb-3 rounded-xl bg-red-500/10 p-3 text-sm text-red-500">
                {locationError}
              </p>
            )}

            {locationResults.length > 0 && (
              <div className="space-y-2">
                <p className={`px-1 text-xs font-bold ${mutedClass}`}>
                  {kk ? "Табылған мекендер" : "Найденные населённые пункты"}
                </p>
                {locationResults.map((result) => (
                  <button
                    key={`${result.id}-${result.latitude}-${result.longitude}`}
                    type="button"
                    onClick={() => choosePlace(result)}
                    className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition ${cardClass} ${
                      dark ? "hover:border-blue-500" : "hover:border-blue-300"
                    }`}
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                    <span className="min-w-0">
                      <span className="block text-sm font-bold">
                        {result.name}
                      </span>
                      <span className={`mt-1 block text-xs leading-5 ${mutedClass}`}>
                        {result.displayName}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}

            <p className={`mt-4 text-[11px] leading-5 ${mutedClass}`}>
              {kk
                ? "Елді мекен іздеу Open-Meteo географиялық деректерін пайдаланады. Дерекқорда жоқ шағын ауылдар іздеу нәтижесінде шықпауы мүмкін."
                : "Поиск использует географические данные Open-Meteo. Небольшие сёла, отсутствующие в базе, могут не отображаться."}
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
