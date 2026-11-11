
import { useEffect, useState } from "react";
import { getAdminCollection } from "@/lib/firestore";

type LogRow = Record<string, any> & {
  id: string;
};

export default function ActivityLog() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getAdminCollection("adminLogs")
      .then((result) => setRows(result as LogRow[]))
      .catch((error: unknown) => {
        setMessage(
          error instanceof Error
            ? error.message
            : "Журналды жүктеу қатесі",
        );
      });
  }, []);

  return (
    <section className="space-y-4 text-slate-900">
      <h2 className="text-xl font-bold">
        Әкімші әрекеттерінің журналы
      </h2>

      {message && (
        <p className="text-sm" role="status">
          {message}
        </p>
      )}

      {rows.length === 0 && (
        <p className="text-sm text-slate-500">
          Журналда әзірге жазба жоқ.
        </p>
      )}

      <div className="space-y-2">
        {rows.map((row) => (
          <article
            key={row.id}
            className="rounded-xl border bg-white p-3"
          >
            <p className="font-semibold">
              {row.action || row.type || "Әрекет"}
            </p>

            <p className="text-sm">
              {row.details || row.description || ""}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Әкімші: {row.adminEmail || row.adminId || "Белгісіз"}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
