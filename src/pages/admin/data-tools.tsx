
import { useState } from "react";
import {
  getAdminCollection,
} from "@/lib/firestore";

const collections = [
  "ads",
  "users",
  "categories",
  "banners",
  "siteSettings",
  "notifications",
  "reports",
  "supportTickets",
  "vipPlans",
  "adminLogs",
];

export default function DataTools() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const exportData = async () => {
    setBusy(true);
    setMessage("");

    try {
      const result: Record<string, unknown> = {};

      for (const collectionName of collections) {
        result[collectionName] =
          await getAdminCollection(collectionName);
      }

      const blob = new Blob(
        [JSON.stringify(result, null, 2)],
        { type: "application/json;charset=utf-8" },
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `baixkz-backup-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;

      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setMessage("Экспорт басталды. Жүктелген JSON файлын сақтап қой.");
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Экспорт қатесі",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-4 text-slate-900">
      <h2 className="text-xl font-bold">
        Деректерді экспорттау
      </h2>

      <p className="text-sm text-slate-600">
        Бұл құрал рұқсаты бар коллекцияларды JSON файлына экспорттайды.
        Ол автоматты түрде толық қалпына келтірмейді. Құпия деректерді
        қауіпсіз сақта және backup файлын ешкімге жариялама.
      </p>

      <button
        type="button"
        disabled={busy}
        onClick={() => void exportData()}
        className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {busy ? "Экспортталуда…" : "JSON backup жүктеу"}
      </button>

      {message && (
        <p className="text-sm" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
