
import { useEffect, useState } from "react";
import {
  getAdminCollection,
  updateAdminRecord,
} from "@/lib/firestore";

type SupportRow = Record<string, any> & {
  id: string;
};

export default function SupportManager() {
  const [rows, setRows] = useState<SupportRow[]>([]);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    const result = await getAdminCollection("supportTickets");
    setRows(result as SupportRow[]);
  };

  useEffect(() => {
    void load().catch((error: unknown) => {
      setMessage(
        error instanceof Error
          ? error.message
          : "Қолдау өтініштерін жүктеу қатесі",
      );
    });
  }, []);

  const changeStatus = async (
    row: SupportRow,
    status: string,
  ) => {
    setBusyId(row.id);
    setMessage("");

    try {
      await updateAdminRecord("supportTickets", row.id, {
        status,
      });
      await load();
      setMessage("Өтініштің күйі жаңартылды.");
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Күйді жаңарту қатесі",
      );
    } finally {
      setBusyId("");
    }
  };

  return (
    <section className="space-y-4 text-slate-900">
      <h2 className="text-xl font-bold">
        Шағымдар және қолдау өтініштері
      </h2>

      {message && (
        <p className="text-sm" role="status">
          {message}
        </p>
      )}

      {rows.length === 0 && (
        <p className="text-sm text-slate-500">
          Әзірге өтініштер жоқ.
        </p>
      )}

      <div className="space-y-3">
        {rows.map((row) => (
          <article
            key={row.id}
            className="space-y-2 rounded-xl border bg-white p-4"
          >
            <h3 className="font-semibold">
              {row.subject || row.title || "Өтініш"}
            </h3>

            <p className="whitespace-pre-wrap text-sm">
              {row.message || row.body || ""}
            </p>

            <p className="text-xs text-slate-500">
              Пайдаланушы: {row.userId || row.email || "Белгісіз"}
            </p>

            <p className="text-xs text-slate-500">
              Күйі: {row.status || "Жаңа"}
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busyId === row.id}
                onClick={() => void changeStatus(row, "in_progress")}
                className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
              >
                Қаралуда
              </button>

              <button
                type="button"
                disabled={busyId === row.id}
                onClick={() => void changeStatus(row, "resolved")}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white disabled:opacity-50"
              >
                Шешілді
              </button>

              <button
                type="button"
                disabled={busyId === row.id}
                onClick={() => void changeStatus(row, "closed")}
                className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
              >
                Жабу
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
