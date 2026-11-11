
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createAdminRecord } from "@/lib/firestore";
import { useAuth } from "@/lib/auth-context";
import { useAppSettings } from "@/lib/app-settings";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function SupportPage() {
  const { user } = useAuth();
  const { language, theme } = useAppSettings();
  const isRu = language === "ru";
  const dark = theme === "dark";
  const navigate = useNavigate();

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error(
        isRu ? "Войдите в аккаунт" : "Алдымен аккаунтқа кіріңіз",
      );
      return;
    }

    if (!subject.trim() || !message.trim()) return;

    setBusy(true);

    try {
      await createAdminRecord("supportTickets", {
        userId: user.uid,
        subject: subject.trim(),
        message: message.trim(),
        status: "open",
      });

      toast.success(
        isRu ? "Обращение отправлено" : "Өтініш жіберілді",
      );

      setSubject("");
      setMessage("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Жіберу қатесі",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main
      className={`min-h-screen px-4 py-8 ${
        dark
          ? "bg-slate-950 text-white"
          : "bg-slate-50 text-slate-900"
      }`}
    >
      <div className="mx-auto max-w-lg">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 text-sm text-blue-600"
        >
          ← {isRu ? "Назад" : "Артқа"}
        </button>

        <h1 className="mb-2 text-2xl font-black">
          {isRu ? "Поддержка" : "Қолдау қызметі"}
        </h1>

        <p className="mb-5 text-sm opacity-70">
          {isRu
            ? "Напишите нам — администратор рассмотрит обращение."
            : "Өтінішіңізді жазыңыз, әкімші қарап шығады."}
        </p>

        <form
          onSubmit={submit}
          className="space-y-4 rounded-2xl border border-slate-300/30 bg-white p-4 text-slate-900"
        >
          <input
            required
            maxLength={120}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-lg border p-3"
            placeholder={
              isRu ? "Тема обращения" : "Өтініш тақырыбы"
            }
          />

          <textarea
            required
            maxLength={5000}
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-lg border p-3"
            placeholder={
              isRu ? "Опишите вопрос" : "Мәселеңізді сипаттаңыз"
            }
          />

          <Button
            disabled={busy}
            type="submit"
            className="w-full"
          >
            {busy
              ? isRu
                ? "Отправка…"
                : "Жіберілуде…"
              : isRu
                ? "Отправить"
                : "Жіберу"}
          </Button>
        </form>
      </div>
    </main>
  );
}
