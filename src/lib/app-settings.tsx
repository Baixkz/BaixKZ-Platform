import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AppLanguage = "kk" | "ru";
export type AppTheme = "light" | "dark";

const translations = {
  kk: {
    home: "Басты бет",
    ads: "Хабарландыру",
    profile: "Профиль",
    language: "Тіл",
    theme: "Тақырып",
    light: "Ашық",
    dark: "Қараңғы",
    settings: "Қосымша баптаулары",
    terms: "Пайдалану шарттары",
    myAds: "Менің хабарландыруларым",
    login: "Google арқылы кіру",
    logout: "Шығу",
    admin: "Әкімші панелі",
    close: "Жабу",
    add: "Қосу",
    area: "Аумақ",
    chooseLocation: "Елді мекенді таңдаңыз",
    searchPlaceholder: "Тауарлар, дүкендер, жұмыс немесе қызметтерді іздеу...",
    pilot: "БАИХ КЗ — Пилоттық жоба",
    heroTitle: "Өз ауылыңның цифрлық орталығы",
    heroDescription: "Хабарландырулар, жергілікті дүкендер және қызметтер бір қосымшада.",
    mainSections: "Негізгі бөлімдер",
    sellAndBuy: "Сатамын және сатып аламын",
    stores: "Дүкендер",
    storesDescription: "Дүкендер мен сауда орындары",
    jobs: "Жұмыс",
    jobsDescription: "Бос орындар мен түйіндемелер",
    transport: "Көлік және такси",
    transportDescription: "Жергілікті тасымал және автокөлік",
    food: "Тамақтану",
    foodDescription: "Асханалар мен кафелер",
    services: "Қызмет көрсету",
    servicesDescription: "Тұрмыстық және техникалық қызмет",
    medical: "Медицина",
    medicalDescription: "Дәріханалар мен медициналық мекемелер",
    institutions: "Мекемелер",
    institutionsDescription: "Мектеп, әкімдік, пошта",
    entertainment: "Ойын-сауық",
    entertainmentDescription: "Іс-шаралар мен спорт",
    selectLocation: "Елді мекенді таңдаңыз",
    weatherUnavailable: "Ауа райы дерегі жоқ",
    sell: "Сатамын",
    buy: "Сатып аламын",
    searchSell: "Сатылымдағы тауарларды іздеу...",
    searchBuy: "Сатып алу сұраныстарын іздеу...",
    all: "Барлығы",
    noResults: "Ештеңе табылмады",
    changeSearch: "Іздеу шарттарын немесе таңдалған санатты өзгертіп көріңіз.",
    topAd: "ТОП ЖАРНАМА",
    priceNegotiable: "Келісімді",
    adTitle: "Хабарландырулар",
    addAd: "Жарнама қосу",
    name: "Атауы",
    phone: "Телефон",
    location: "Орналасқан жері",
    date: "Күні",
    loading: "Жүктелуде...",
    error: "Қате орын алды",
    back: "Артқа",
    save: "Сақтау",
    cancel: "Болдырмау",
    account: "Жеке кабинет",
    signInRequired: "Жалғастыру үшін Google арқылы кіріңіз",
    termsText:
      "Қосымшаны пайдалану кезінде заң талаптарын және басқа пайдаланушылардың құқықтарын сақтаңыз.\n\nАккаунтты жою: профильде сұраныс жіберген сәттен бастап хабарландыруларыңыз бен деректеріңіз басқа пайдаланушыларға көрінбейді. Әкімші сұранысты бекітсе, деректер 7 күн ішінде жойылады. Әкімші бекітпесе, деректер 30 күн ішінде автоматты түрде жойылады.\n\nҚауіпсіздікті қамтамасыз ету, алаяқтықтың алдын алу немесе заң талаптарын орындау қажет болса, әкімші тексеру үшін жоюды тоқтатып, деректерді сақтап қала алады.",
  },
  ru: {
    home: "Главная",
    ads: "Объявления",
    profile: "Профиль",
    language: "Язык",
    theme: "Тема",
    light: "Светлая",
    dark: "Тёмная",
    settings: "Дополнительные настройки",
    terms: "Условия использования",
    myAds: "Мои объявления",
    login: "Войти через Google",
    logout: "Выйти",
    admin: "Панель администратора",
    close: "Закрыть",
    add: "Добавить",
    area: "Регион",
    chooseLocation: "Выберите населённый пункт",
    searchPlaceholder: "Поиск товаров, магазинов, работы или услуг...",
    pilot: "BAIX KZ — Пилотный проект",
    heroTitle: "Цифровой центр твоего села",
    heroDescription: "Объявления, местные магазины и услуги в одном приложении.",
    mainSections: "Основные разделы",
    sellAndBuy: "Продам и куплю",
    stores: "Магазины",
    storesDescription: "Магазины и торговые точки",
    jobs: "Работа",
    jobsDescription: "Вакансии и резюме",
    transport: "Транспорт и такси",
    transportDescription: "Местные перевозки и автомобили",
    food: "Питание",
    foodDescription: "Столовые и кафе",
    services: "Услуги",
    servicesDescription: "Бытовые и технические услуги",
    medical: "Медицина",
    medicalDescription: "Аптеки и медицинские учреждения",
    institutions: "Учреждения",
    institutionsDescription: "Школа, акимат, почта",
    entertainment: "Развлечения",
    entertainmentDescription: "Мероприятия и спорт",
    selectLocation: "Выберите населённый пункт",
    weatherUnavailable: "Нет данных о погоде",
    sell: "Продам",
    buy: "Куплю",
    searchSell: "Поиск товаров на продажу...",
    searchBuy: "Поиск объявлений о покупке...",
    all: "Все",
    noResults: "Ничего не найдено",
    changeSearch: "Попробуйте изменить поисковый запрос или категорию.",
    topAd: "ТОП-ОБЪЯВЛЕНИЕ",
    priceNegotiable: "Договорная",
    adTitle: "Объявления",
    addAd: "Добавить объявление",
    name: "Название",
    phone: "Телефон",
    location: "Местоположение",
    date: "Дата",
    loading: "Загрузка...",
    error: "Произошла ошибка",
    back: "Назад",
    save: "Сохранить",
    cancel: "Отмена",
    account: "Личный кабинет",
    signInRequired: "Войдите через Google, чтобы продолжить",
    termsText:
      "При использовании приложения соблюдайте требования закона и права других пользователей.\n\nУдаление аккаунта: с момента отправки запроса в профиле ваши объявления и данные перестают быть видны другим пользователям. Если администратор подтвердит запрос, данные будут удалены в течение 7 дней. Если администратор не подтвердит, данные будут удалены автоматически в течение 30 дней.\n\nЕсли это необходимо для обеспечения безопасности, предотвращения мошенничества или выполнения требований закона, администратор может приостановить удаление и сохранить данные для проверки.",
  },
} as const;

export type TranslationKey = keyof typeof translations.kk;

interface AppSettingsContextValue {
  language: AppLanguage;
  theme: AppTheme;
  setLanguage: (language: AppLanguage) => void;
  setTheme: (theme: AppTheme) => void;
  t: (key: TranslationKey) => string;
}

const AppSettingsContext = createContext<AppSettingsContextValue | undefined>(
  undefined,
);

interface AppSettingsProviderProps {
  children: ReactNode;
}

export function AppSettingsProvider({
  children,
}: AppSettingsProviderProps) {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    try {
      const saved = localStorage.getItem("baixkz-language");
      return saved === "ru" ? "ru" : "kk";
    } catch {
      return "kk";
    }
  });

  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      return localStorage.getItem("baixkz-theme") === "dark"
        ? "dark"
        : "light";
    } catch {
      return "light";
    }
  });

  const setLanguage = (value: AppLanguage) => {
    setLanguageState(value);
    try {
      localStorage.setItem("baixkz-language", value);
    } catch {
      // Баптауды сақтау мүмкін болмаса, қолданба жұмысын жалғастырады.
    }
  };

  const setTheme = (value: AppTheme) => {
    setThemeState(value);
    try {
      localStorage.setItem("baixkz-theme", value);
    } catch {
      // Баптауды сақтау мүмкін болмаса, қолданба жұмысын жалғастырады.
    }
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = language;
  }, [theme, language]);

  const value = useMemo<AppSettingsContextValue>(() => {
    return {
      language,
      theme,
      setLanguage,
      setTheme,
      t: (key) => translations[language][key] ?? translations.kk[key],
    };
  }, [language, theme]);

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings(): AppSettingsContextValue {
  const context = useContext(AppSettingsContext);

  if (!context) {
    throw new Error(
      "useAppSettings must be used inside AppSettingsProvider",
    );
  }

  return context;
      }
