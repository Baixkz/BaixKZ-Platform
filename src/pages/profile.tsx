
import { useEffect, useState } from "react";
import {
  LogOut,
  User,
  ChevronRight,
  FileText,
  ShieldCheck,
  Languages,
  Moon,
  Sun,
  Settings,
  Megaphone,
  Loader2,
  UserX,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../lib/auth-context";
import { useAppSettings } from "../lib/app-settings";
import { LoginModal } from "../components/login-modal";

export default function ProfilePage() {
  const navigate = useNavigate();

  const {
    user,
    logout,
    isAdmin,
    isLoading,
    requestAccountDeletion,
    cancelAccountDeletion,
    refreshUser,
  } = useAuth();

  const { language, setLanguage, theme, setTheme, t } = useAppSettings();

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletionBusy, setDeletionBusy] = useState(false);

  const dark = theme === "dark";
  const isRu = language === "ru";

  const pageClass = dark
    ? "min-h-screen bg-slate-950 text-white"
    : "min-h-screen bg-slate-50 text-slate-900";

  const cardClass = dark
    ? "border-slate-800 bg-slate-900"
    : "border-slate-200 bg-white";

  const secondaryText = dark
    ? "text-slate-400"
    : "text-slate-500";

  useEffect(() => {
    if (!user?.uid) return;

    void refreshUser().catch((error) => {
      console.error("Профильді жаңарту қатесі:", error);
    });
  }, [user?.uid]);

  const deleteText = {
    title: isRu ? "Удаление аккаунта" : "Аккаунтты жою",

    intro: isRu
      ? "Отправьте запрос на удаление. С этого момента ваши объявления и данные перестанут быть видны другим пользователям."
      : "Жою сұранысын жіберіңіз. Сол сәттен бастап хабарландыруларыңыз бен деректеріңіз басқа пайдаланушыларға көрінбейді.",

    requestButton: isRu
      ? "Запросить удаление"
      : "Жоюға сұраныс жіберу",

    confirmTitle: isRu
      ? "Запросить удаление аккаунта?"
      : "Аккаунтты жоюға сұраныс жіберілсін бе?",

    confirmPoints: isRu
      ? [
          "Все ваши объявления сразу будут скрыты.",
          "Если администратор подтвердит запрос, данные будут удалены в течение 7 дней.",
          "Если администратор не ответит, данные будут удалены автоматически в течение 30 дней.",
          "Пока запрос не подтверждён, его можно отозвать.",
          "При необходимости проверки безопасности администратор может приостановить удаление.",
        ]
      : [
          "Барлық хабарландыруларыңыз бірден жасырылады.",
          "Әкімші сұранысты бекітсе, деректер 7 күн ішінде жойылады.",
          "Әкімші жауап бермесе, деректер 30 күн ішінде автоматты түрде жойылады.",
          "Әкімші бекіткенге дейін сұранысты кері алуға болады.",
          "Қауіпсіздік тексеруі қажет болса, әкімші жоюды тоқтатып қоя алады.",
        ],

    confirmSend: isRu
      ? "Отправить запрос"
      : "Сұраныс жіберу",

    cancel: isRu ? "Отмена" : "Болдырмау",

    requestedTitle: isRu
      ? "Запрос отправлен"
      : "Сұраныс жіберілді",

    requestedBody: isRu
      ? "Ваши объявления и данные скрыты. Если администратор подтвердит запрос, данные будут удалены в течение 7 дней, иначе автоматически"
      : "Хабарландыруларыңыз бен деректеріңіз жасырылған. Әкімші бекітсе, деректер 7 күн ішінде жойылады, әйтпесе автоматты түрде",

    dateWord: isRu ? "не позднее" : "ең көбі",

    withdraw: isRu
      ? "Отозвать запрос"
      : "Сұранысты кері алу",

    approvedTitle: isRu
      ? "Запрос подтверждён"
      : "Сұраныс бекітілді",

    approvedBody: isRu
      ? "Администратор подтвердил запрос. Ваши данные будут удалены"
      : "Әкімші сұранысты бекітті. Деректеріңіз жойылады",

    heldTitle: isRu
      ? "Запрос на проверке"
      : "Сұраныс тексеріліп жатыр",

    heldBody: isRu
      ? "Удаление приостановлено для проверки. Для уточнения свяжитесь с администратором."
      : "Жою тексеру үшін тоқтатылды. Нақтылау үшін әкімшіге хабарласыңыз.",

    sent: isRu
      ? "Запрос на удаление отправлен"
      : "Жою сұранысы жіберілді",

    withdrawn: isRu
      ? "Запрос отозван"
      : "Сұраныс кері алынды",

    failed: isRu
      ? "Не удалось выполнить действие. Попробуйте позже."
      : "Әрекетті орындау мүмкін болмады. Кейінірек қайталап көріңіз.",
  };

  const formattedDeleteDate = user?.deleteAt
    ? new Date(user.deleteAt).toLocaleDateString(
        isRu ? "ru-RU" : "kk-KZ",
        {
          day: "numeric",
          month: "long",
          year: "numeric",
        },
      )
    : "";

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      await logout();
    } catch (error) {
      console.error("Шығу қатесі:", error);
      toast.error(
        isRu ? "Не удалось выйти" : "Аккаунттан шығу мүмкін болмады",
      );
    } finally {
      setLoggingOut(false);
    }
  };

  const handleRequestDeletion = async () => {
    setDeletionBusy(true);

    try {
      await requestAccountDeletion();
      setShowDeleteConfirm(false);
      toast.success(deleteText.sent);
    } catch (error) {
      console.error("Жою сұранысын жіберу қатесі:", error);
      toast.error(deleteText.failed);
    } finally {
      setDeletionBusy(false);
    }
  };

  const handleCancelDeletion = async () => {
    setDeletionBusy(true);

    try {
      await cancelAccountDeletion();
      toast.success(deleteText.withdrawn);
    } catch (error) {
      console.error("Жою сұранысын кері алу қатесі:", error);
      toast.error(deleteText.failed);
    } finally {
      setDeletionBusy(false);
    }
  };

  if (isLoading) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center ${pageClass}`}
      >
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <main className={`${pageClass} px-4 pb-28 pt-8 transition-colors`}>
      <div className="mx-auto max-w-lg">
        <header className="mb-7 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black">
              {t("profile")}
            </h1>

            <p className={`mt-1 text-sm ${secondaryText}`}>
              {t("settings")}
            </p>
          </div>

          {user && (
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={loggingOut}
              aria-label={t("logout")}
              className="rounded-2xl bg-red-500/10 p-3 text-red-500 transition hover:bg-red-500/20 disabled:opacity-50"
            >
              {loggingOut ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <LogOut className="h-5 w-5" />
              )}
            </button>
          )}
        </header>

        {!user ? (
          <section
            className={`rounded-3xl border p-7 text-center shadow-sm ${cardClass}`}
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
              <User className="h-8 w-8" />
            </div>

            <h2 className="text-lg font-extrabold">
              {t("account")}
            </h2>

            <p className={`mb-6 mt-2 text-sm leading-6 ${secondaryText}`}>
              {language === "kk"
                ? "Хабарландыруларыңызды жариялау және басқару үшін Google аккаунтыңызбен кіріңіз."
                : "Войдите через Google, чтобы публиковать объявления и управлять ими."}
            </p>

            <button
              type="button"
              onClick={() => setIsLoginOpen(true)}
              className="w-full rounded-2xl bg-blue-600 px-5 py-4 font-extrabold text-white transition hover:bg-blue-700 active:scale-[0.98]"
            >
              {t("login")}
            </button>
          </section>
        ) : (
          <section
            className={`mb-5 flex items-center gap-4 rounded-3xl border p-5 shadow-sm ${cardClass}`}
          >
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={
                  language === "kk"
                    ? "Профиль суреті"
                    : "Фото профиля"
                }
                referrerPolicy="no-referrer"
                className="h-16 w-16 shrink-0 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-black text-white">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h2 className="break-words text-lg font-black">
                {user.name}
              </h2>

              <p className={`mt-1 break-all text-sm ${secondaryText}`}>
                {user.email}
              </p>
            </div>
          </section>
        )}

        <section className={`mb-5 rounded-3xl border p-5 ${cardClass}`}>
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-500">
              <Languages className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-extrabold">
                {t("language")}
              </h2>

              <p className={`text-xs ${secondaryText}`}>
                {language === "kk"
                  ? "Қолданба тілін таңдаңыз"
                  : "Выберите язык приложения"}
              </p>
            </div>
          </div>

          <div
            className={`grid grid-cols-2 gap-2 rounded-2xl p-1 ${
              dark ? "bg-slate-800" : "bg-slate-100"
            }`}
          >
            <button
              type="button"
              onClick={() => setLanguage("kk")}
              aria-pressed={language === "kk"}
              className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                language === "kk"
                  ? "bg-blue-600 text-white shadow"
                  : secondaryText
              }`}
            >
              Қазақша
            </button>

            <button
              type="button"
              onClick={() => setLanguage("ru")}
              aria-pressed={language === "ru"}
              className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                language === "ru"
                  ? "bg-blue-600 text-white shadow"
                  : secondaryText
              }`}
            >
              Русский
            </button>
          </div>
        </section>

        <section className={`mb-5 rounded-3xl border p-5 ${cardClass}`}>
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-violet-500/10 p-2.5 text-violet-500">
              {dark ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </div>

            <div>
              <h2 className="font-extrabold">
                {t("theme")}
              </h2>

              <p className={`text-xs ${secondaryText}`}>
                {language === "kk"
                  ? "Қолданба көрінісін өзгерту"
                  : "Изменить оформление приложения"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTheme("light")}
              aria-pressed={theme === "light"}
              className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-bold transition ${
                theme === "light"
                  ? "border-blue-500 bg-blue-500/10 text-blue-500"
                  : dark
                    ? "border-slate-700"
                    : "border-slate-200"
              }`}
            >
              <Sun className="h-4 w-4" />
              {t("light")}
            </button>

            <button
              type="button"
              onClick={() => setTheme("dark")}
              aria-pressed={theme === "dark"}
              className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-bold transition ${
                theme === "dark"
                  ? "border-blue-500 bg-blue-500/10 text-blue-500"
                  : dark
                    ? "border-slate-700"
                    : "border-slate-200"
              }`}
            >
              <Moon className="h-4 w-4" />
              {t("dark")}
            </button>
          </div>
        </section>

        <section
          className={`mb-5 overflow-hidden rounded-3xl border ${cardClass}`}
        >
          {user && (
            <button
              type="button"
              onClick={() => navigate("/my-ads")}
              className={`flex w-full items-center gap-3 p-5 text-left transition ${
                dark ? "hover:bg-slate-800" : "hover:bg-slate-50"
              }`}
            >
              <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-500">
                <Megaphone className="h-5 w-5" />
              </div>

              <span className="flex-1 font-bold">
                {t("myAds")}
              </span>

              <ChevronRight className={`h-5 w-5 ${secondaryText}`} />
            </button>
          )}

          {user && (
            <div
              className={`mx-5 border-t ${
                dark ? "border-slate-800" : "border-slate-100"
              }`}
            />
          )}

          {user && (
            <>
              <button
                type="button"
                onClick={() => navigate("/support")}
                className={`flex w-full items-center gap-3 p-5 text-left transition ${
                  dark ? "hover:bg-slate-800" : "hover:bg-slate-50"
                }`}
              >
                <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-500">
                  <FileText className="h-5 w-5" />
                </div>

                <span className="flex-1 font-bold">
                  {isRu ? "Поддержка" : "Қолдау қызметі"}
                </span>

                <ChevronRight className={`h-5 w-5 ${secondaryText}`} />
              </button>

              <div
                className={`mx-5 border-t ${
                  dark ? "border-slate-800" : "border-slate-100"
                }`}
              />
            </>
          )}

          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => navigate("/admin")}
                className={`flex w-full items-center gap-3 p-5 text-left transition ${
                  dark ? "hover:bg-slate-800" : "hover:bg-slate-50"
                }`}
              >
                <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-500">
                  <ShieldCheck className="h-5 w-5" />
                </div>

                <span className="flex-1 font-bold">
                  {t("admin")}
                </span>

                <ChevronRight className={`h-5 w-5 ${secondaryText}`} />
              </button>

              <div
                className={`mx-5 border-t ${
                  dark ? "border-slate-800" : "border-slate-100"
                }`}
              />
            </>
          )}

          <button
            type="button"
            onClick={() => setShowTerms(true)}
            className={`flex w-full items-center gap-3 p-5 text-left transition ${
              dark ? "hover:bg-slate-800" : "hover:bg-slate-50"
            }`}
          >
            <div className="rounded-xl bg-slate-500/10 p-2.5">
              <FileText className="h-5 w-5" />
            </div>

            <span className="flex-1 font-bold">
              {t("terms")}
            </span>

            <ChevronRight className={`h-5 w-5 ${secondaryText}`} />
          </button>
        </section>

        {user && !isAdmin && (
          <section className={`mb-5 rounded-3xl border p-5 ${cardClass}`}>
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-xl bg-red-500/10 p-2.5 text-red-500">
                <UserX className="h-5 w-5" />
              </div>

              <h2 className="font-extrabold">
                {deleteText.title}
              </h2>
            </div>

            {user.deletionStatus === "none" && (
              <>
                <p className={`mb-4 text-sm leading-6 ${secondaryText}`}>
                  {deleteText.intro}
                </p>

                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-bold text-red-500 transition hover:bg-red-500/20"
                >
                  {deleteText.requestButton}
                </button>
              </>
            )}

            {user.deletionStatus === "requested" && (
              <>
                <div
                  className={`mb-4 rounded-2xl border p-4 text-sm leading-6 ${
                    dark
                      ? "border-amber-900 bg-amber-950/30 text-amber-200"
                      : "border-amber-200 bg-amber-50 text-amber-800"
                  }`}
                >
                  <p className="mb-1 font-bold">
                    {deleteText.requestedTitle}
                  </p>

                  <p>
                    {deleteText.requestedBody}
                    {formattedDeleteDate
                      ? ` (${deleteText.dateWord}: ${formattedDeleteDate})`
                      : ""}
                    .
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void handleCancelDeletion()}
                  disabled={deletionBusy}
                  className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition disabled:opacity-50 ${
                    dark
                      ? "bg-slate-800 text-slate-100 hover:bg-slate-700"
                      : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                  }`}
                >
                  {deletionBusy && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {deleteText.withdraw}
                </button>
              </>
            )}

            {user.deletionStatus === "approved" && (
              <div
                className={`rounded-2xl border p-4 text-sm leading-6 ${
                  dark
                    ? "border-red-900 bg-red-950/30 text-red-200"
                    : "border-red-200 bg-red-50 text-red-800"
                }`}
              >
                <p className="mb-1 font-bold">
                  {deleteText.approvedTitle}
                </p>

                <p>
                  {deleteText.approvedBody}
                  {formattedDeleteDate
                    ? ` (${deleteText.dateWord}: ${formattedDeleteDate})`
                    : ""}
                  .
                </p>
              </div>
            )}

            {user.deletionStatus === "held" && (
              <div
                className={`rounded-2xl border p-4 text-sm leading-6 ${
                  dark
                    ? "border-slate-700 bg-slate-800 text-slate-200"
                    : "border-slate-200 bg-slate-50 text-slate-700"
                }`}
              >
                <p className="mb-1 font-bold">
                  {deleteText.heldTitle}
                </p>

                <p>{deleteText.heldBody}</p>
              </div>
            )}
          </section>
        )}

        <div
          className={`flex items-center justify-center gap-2 py-3 text-xs ${secondaryText}`}
        >
          <Settings className="h-4 w-4" />
          <span>Baixkz</span>
        </div>
      </div>

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
          onClick={() => {
            if (!deletionBusy) setShowDeleteConfirm(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-heading"
            className={`max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl border p-6 shadow-2xl ${cardClass}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-red-500/10 p-2.5 text-red-500">
                <AlertTriangle className="h-5 w-5" />
              </div>

              <h2 id="delete-heading" className="text-lg font-black">
                {deleteText.confirmTitle}
              </h2>
            </div>

            <ul
              className={`mb-6 list-disc space-y-2 pl-5 text-sm leading-6 ${secondaryText}`}
            >
              {deleteText.confirmPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deletionBusy}
                className={`rounded-2xl px-4 py-3 text-sm font-bold transition disabled:opacity-50 ${
                  dark
                    ? "bg-slate-800 text-slate-100 hover:bg-slate-700"
                    : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                }`}
              >
                {deleteText.cancel}
              </button>

              <button
                type="button"
                onClick={() => void handleRequestDeletion()}
                disabled={deletionBusy}
                className="flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {deletionBusy && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {deleteText.confirmSend}
              </button>
            </div>
          </section>
        </div>
      )}

      {showTerms && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowTerms(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="terms-heading"
            className={`max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-3xl border p-6 shadow-2xl ${cardClass}`}
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="terms-heading" className="mb-4 text-xl font-black">
              {t("terms")}
            </h2>

            <p
              className={`whitespace-pre-line text-sm leading-7 ${secondaryText}`}
            >
              {t("termsText")}
            </p>

            <button
              type="button"
              onClick={() => setShowTerms(false)}
              className="mt-6 w-full rounded-2xl bg-blue-600 px-4 py-3 font-bold text-white"
            >
              {t("close")}
            </button>
          </section>
        </div>
      )}

      <LoginModal
        open={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />
    </main>
  );
}
