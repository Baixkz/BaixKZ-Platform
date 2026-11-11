
import { useState, useEffect } from "react";
import { Shield, ShieldOff, Search } from "lucide-react";
import {
  getAllUsers,
  updateUser,
  approveUserDeletion,
  holdUserDeletion,
  getAdsByUser,
  getReportsByUser,
  logAdminAction,
} from "@/lib/firestore";
import { useToast } from "@/hooks/use-toast";
import { MASTER_ADMIN_UID } from "@/lib/firebase";

interface ManagedUser {
  id: string;
  uid?: string;
  name?: string;
  email?: string;
  photoURL?: string;
  blocked?: boolean;
  deletionStatus?: string;
  deleteAt?: unknown;
}

function toMillis(value: unknown): number | null {
  const candidate = value as
    | { toMillis?: () => number }
    | null
    | undefined;

  if (candidate && typeof candidate.toMillis === "function") {
    return candidate.toMillis();
  }

  return null;
}

function formatDate(value: unknown): string {
  const millis = toMillis(value);

  if (millis === null) return "";

  return new Date(millis).toLocaleDateString("kk-KZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function deletionRank(user: ManagedUser): number {
  if (user.deletionStatus === "requested") return 0;
  if (user.deletionStatus === "approved") return 1;
  if (user.deletionStatus === "held") return 2;
  return 3;
}

export function UserManager() {
  const { toast } = useToast();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [historyUserId, setHistoryUserId] = useState<string | null>(null);

  const [historyAds, setHistoryAds] = useState<
    Array<{ id: string; title: string; status: string }>
  >([]);

  const [historyReports, setHistoryReports] = useState<
    Array<Record<string, unknown> & { id: string }>
  >([]);

  const [historyLoading, setHistoryLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);

    try {
      const data = await getAllUsers();
      setUsers(Array.isArray(data) ? (data as ManagedUser[]) : []);
    } catch (error) {
      console.error("Пайдаланушыларды жүктеу қатесі:", error);
      setUsers([]);

      toast({
        title: "Пайдаланушыларды жүктеу мүмкін болмады",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const handleBlock = async (
    user: ManagedUser,
    blocked: boolean,
  ) => {
    if (!user.id) {
      toast({
        title: "Пайдаланушы UID-і табылмады",
        variant: "destructive",
      });
      return;
    }

    if (user.id === MASTER_ADMIN_UID) {
      toast({
        title: "Негізгі әкімшіні бұғаттауға болмайды",
        variant: "destructive",
      });
      return;
    }

    try {
      if (
        blocked &&
        (user.deletionStatus === "requested" ||
          user.deletionStatus === "approved")
      ) {
        await holdUserDeletion(user.id);
      }

      await updateUser(user.id, { blocked });

      await logAdminAction(
        blocked ? "user_blocked" : "user_unblocked",
        { userId: user.id },
      );

      toast({
        title: blocked
          ? "Пайдаланушы бұғатталды"
          : "Пайдаланушының бұғаты алынды",
      });

      await loadUsers();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Қате орын алды";

      toast({
        title: message,
        variant: "destructive",
      });
    }
  };

  const editProfile = async (user: ManagedUser) => {
    if (user.id === MASTER_ADMIN_UID) return;

    const name = window.prompt(
      "Пайдаланушының аты",
      user.name || "",
    );

    if (name === null || !name.trim()) return;

    try {
      await updateUser(user.id, { name: name.trim() });

      await logAdminAction("user_profile_updated", {
        userId: user.id,
        fields: ["name"],
      });

      await loadUsers();

      toast({ title: "Профиль жаңартылды" });
    } catch (error) {
      toast({
        title:
          error instanceof Error
            ? error.message
            : "Профильді өзгерту қатесі",
        variant: "destructive",
      });
    }
  };

  const showHistory = async (user: ManagedUser) => {
    setHistoryUserId(user.id);
    setHistoryLoading(true);
    setHistoryAds([]);
    setHistoryReports([]);

    try {
      const [ads, reports] = await Promise.all([
        getAdsByUser(user.id),
        getReportsByUser(user.id),
      ]);

      setHistoryAds(ads);
      setHistoryReports(reports);
    } catch (error) {
      toast({
        title:
          error instanceof Error
            ? error.message
            : "Тарихты жүктеу қатесі",
        variant: "destructive",
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleApproveDeletion = async (user: ManagedUser) => {
    if (
      !window.confirm(
        "Жоюды бекітесіз бе? Деректер 7 күннен кейін жойылады.",
      )
    ) {
      return;
    }

    setBusyId(user.id);

    try {
      await approveUserDeletion(user.id);

      toast({ title: "Жою бекітілді (7 күн)" });

      await loadUsers();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Қате орын алды";

      toast({
        title: message,
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleHoldDeletion = async (user: ManagedUser) => {
    if (
      !window.confirm(
        "Жоюды тоқтатып, деректерді сақтап қалу керек пе?",
      )
    ) {
      return;
    }

    setBusyId(user.id);

    try {
      await holdUserDeletion(user.id);

      toast({
        title: "Жою тоқтатылды, деректер сақталады",
      });

      await loadUsers();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Қате орын алды";

      toast({
        title: message,
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  const normalizedSearch = search.trim().toLowerCase();

  const filteredUsers = users
    .filter((user) => {
      if (!normalizedSearch) return true;

      return (
        user.name?.toLowerCase().includes(normalizedSearch) ||
        user.email?.toLowerCase().includes(normalizedSearch) ||
        user.id.toLowerCase().includes(normalizedSearch)
      );
    })
    .sort((a, b) => deletionRank(a) - deletionRank(b));

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

        <input
          type="text"
          placeholder="Аты, Gmail немесе UID бойынша іздеу..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm outline-none focus:ring-2 ring-primary/20 transition-all"
        />
      </div>

      <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-3">
        {filteredUsers.length} пайдаланушы табылды
      </p>

      {filteredUsers.length === 0 ? (
        <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed border-border">
          <p className="text-muted-foreground text-sm">
            Пайдаланушылар табылмады
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredUsers.map((user) => {
            const isMasterAdmin = user.id === MASTER_ADMIN_UID;
            const deleteDate = formatDate(user.deleteAt);
            const isBusy = busyId === user.id;

            return (
              <div
                key={user.id}
                className="bg-card border border-border rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                      <span className="text-sm font-black text-primary">
                        {user.name?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold break-words">
                        {user.name || "Аты көрсетілмеген"}
                      </h4>

                      {isMasterAdmin && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-amber-500 text-white uppercase">
                          Master Admin
                        </span>
                      )}

                      {user.blocked && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-red-600 text-white uppercase">
                          Бұғатталған
                        </span>
                      )}

                      {user.deletionStatus === "requested" && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-amber-500 text-white uppercase">
                          Жою сұранысы
                        </span>
                      )}

                      {user.deletionStatus === "approved" && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-orange-600 text-white uppercase">
                          Жойылуда
                        </span>
                      )}

                      {user.deletionStatus === "held" && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-slate-600 text-white uppercase">
                          Ұсталған
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-medium text-muted-foreground break-all">
                      {user.email || "Gmail көрсетілмеген"}
                    </p>

                    {deleteDate &&
                      (user.deletionStatus === "requested" ||
                        user.deletionStatus === "approved") && (
                        <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                          Жойылу күні: {deleteDate}
                        </p>
                      )}
                  </div>

                  {!isMasterAdmin && (
                    <button
                      type="button"
                      onClick={() =>
                        void handleBlock(user, !user.blocked)
                      }
                      className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
                        user.blocked
                          ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          : "bg-red-50 text-red-500 hover:bg-red-100"
                      }`}
                      title={
                        user.blocked
                          ? "Пайдаланушының бұғатын алу"
                          : "Пайдаланушыны бұғаттау"
                      }
                      aria-label={
                        user.blocked
                          ? "Бұғатты алу"
                          : "Пайдаланушыны бұғаттау"
                      }
                    >
                      {user.blocked ? (
                        <Shield className="w-4 h-4" />
                      ) : (
                        <ShieldOff className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                  {!isMasterAdmin && (
                    <button
                      type="button"
                      onClick={() => void editProfile(user)}
                      className="rounded-lg border px-2.5 py-1.5 text-xs"
                    >
                      Профильді өзгерту
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => void showHistory(user)}
                    className="rounded-lg border px-2.5 py-1.5 text-xs"
                  >
                    Жарнама тарихы
                  </button>
                </div>

                {historyUserId === user.id && (
                  <div className="mt-2 rounded-lg bg-muted/40 p-3">
                    <div className="mb-2 flex items-center justify-between text-xs font-bold">
                      <span>Жарнама тарихы</span>
                      <button
                        type="button"
                        onClick={() => setHistoryUserId(null)}
                      >
                        Жабу
                      </button>
                    </div>

                    {historyLoading ? (
                      <p className="text-xs">Жүктелуде…</p>
                    ) : (
                      <>
                        <p className="mb-1 mt-2 text-[11px] font-bold">
                          Жарнамалар ({historyAds.length})
                        </p>

                        {historyAds.map((ad) => (
                          <div
                            key={ad.id}
                            className="flex justify-between gap-2 border-b border-border py-1.5 text-xs"
                          >
                            <span className="min-w-0 truncate">
                              {ad.title}
                            </span>
                            <span className="shrink-0">
                              {ad.status}
                            </span>
                          </div>
                        ))}

                        <p className="mb-1 mt-3 text-[11px] font-bold">
                          Шағымдар ({historyReports.length})
                        </p>

                        {historyReports.map((report) => (
                          <div
                            key={report.id}
                            className="flex justify-between gap-2 border-b border-border py-1.5 text-xs"
                          >
                            <span className="min-w-0 truncate">
                              {String(
                                report.reason ||
                                  report.message ||
                                  "Шағым",
                              )}
                            </span>
                            <span className="shrink-0">
                              {String(report.status || "open")}
                            </span>
                          </div>
                        ))}

                        {historyAds.length === 0 &&
                          historyReports.length === 0 && (
                            <p className="text-xs text-muted-foreground">
                              Тарих бос.
                            </p>
                          )}
                      </>
                    )}
                  </div>
                )}

                {!isMasterAdmin &&
                  (user.deletionStatus === "requested" ||
                    user.deletionStatus === "approved") && (
                    <div className="flex gap-1.5 flex-wrap mt-3 pt-3 border-t border-border">
                      {user.deletionStatus === "requested" && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            void handleApproveDeletion(user)
                          }
                          className="px-2.5 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium disabled:opacity-50"
                        >
                          Бекіту (7 күн)
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          void handleHoldDeletion(user)
                        }
                        className="px-2.5 py-1.5 bg-slate-200 text-slate-800 rounded-lg text-xs font-medium disabled:opacity-50"
                      >
                        Ұстап қалу
                      </button>
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
