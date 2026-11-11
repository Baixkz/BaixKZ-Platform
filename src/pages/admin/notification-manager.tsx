
import { useEffect, useState } from "react";
import {
  createAdminRecord,
  getAdminCollection,
  updateAdminRecord,
} from "@/lib/firestore";

type NotificationRow = Record<string, unknown> & {
  id: string;
  title?: string;
  body?: string;
  active?: boolean;
};

export default function NotificationManager() {
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    const result = await getAdminCollection("notifications");
    setRows(result as NotificationRow[]);
  };

  useEffect(() => {
    void load().catch((error: unknown) => {
      setMessage(
        error instanceof Error
          ? error.message
          : "Хабарламаларды жүктеу қатесі",
      );
    });
  }, []);

  const add = async () => {
    if (!title.trim() || !body.trim()) {
      setMessage("Тақырып пен хабарлама мәтінін енгіз.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      await createAdminRecord("notifications", {
        title: title.trim(),
        body: body.trim(),
        active: true,
        language: "both",
        audience: "all",
      });

      setTitle("");
      setBody("");
      await load();
      setMessage("Хабарлама сақталды.");
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Хабарламаны сақтау қатесі",
      );
    } finally {
      setBusy(false);
    }
  };

  const toggleNotification = async (row: NotificationRow) => {
    try {
      await updateAdminRecord("notifications", row.id, {
        active: !row.active,
      });

      await load();
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Хабарлама күйін өзгерту қатесі",
      );
    }
  };

  return (
    <section className="space-y-4 text-slate-900">
      <h2 className="text-xl font-bold">
        Хабарламалар орталығы
      </h2>

      <p className="text-sm text-slate-500">
        Хабарламалар Firestore базасында сақталады.
        Телефонға push-хабарлама жіберу үшін бөлек
        push-интеграция қажет.
      </p>

      <input
        className="w-full rounded-lg border p-2"
        placeholder="Тақырып"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />

      <textarea
        className="w-full rounded-lg border p-2"
        placeholder="Хабарлама мәтіні"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={4}
      />

      <button
        type="button"
        disabled={busy}
        onClick={() => void add()}
        className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {busy ? "Сақталуда…" : "Жалпы хабарлама жариялау"}
      </button>

      {message && (
        <p className="text-sm" role="status">
          {message}
        </p>
      )}

      <div className="space-y-2">
        {rows.map((row) => (
          <article
            key={row.id}
            className="rounded-xl border bg-white p-3"
          >
            <div className="font-semibold">
              {row.title ?? "Тақырып жоқ"}
            </div>

            <p className="my-2 whitespace-pre-wrap text-sm">
              {row.body ?? ""}
            </p>

            <button
              type="button"
              className="rounded border px-3 py-1 text-sm"
              onClick={() => void toggleNotification(row)}
            >
              {row.active ? "Өшіру" : "Қосу"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
