
import { Link, useLocation } from "react-router-dom";
import { Home, PlusSquare, User } from "lucide-react";
import { useAppSettings } from "../lib/app-settings";

export default function BottomNav() {
  const location = useLocation();
  const { t, language, theme } = useAppSettings();

  const navItems = [
    { icon: Home, label: t("home"), path: "/" },
    { icon: PlusSquare, label: t("ads"), path: "/ads" },
    { icon: User, label: t("profile"), path: "/profile" },
  ];

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-[100] border-t px-4 pb-5 pt-2 ${
        theme === "dark"
          ? "border-slate-800 bg-slate-950"
          : "border-slate-100 bg-white"
      }`}
      aria-label={language === "kk" ? "Негізгі навигация" : "Основная навигация"}
    >
      <div className="mx-auto flex max-w-md items-center justify-around">
        {navItems.map((item) => {
          const isActive =
            item.path === "/"
              ? location.pathname === "/"
              : item.path === "/ads"
                ? location.pathname === "/ads" ||
                  location.pathname.startsWith("/ad/")
                : location.pathname === item.path;

          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={isActive ? "page" : undefined}
              className="flex min-w-20 flex-col items-center gap-1 transition-transform active:scale-90"
            >
              <div
                className={`rounded-2xl p-2 transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg"
                    : theme === "dark"
                      ? "text-slate-400 hover:bg-slate-800"
                      : "text-slate-400 hover:bg-slate-50"
                }`}
              >
                <Icon className="h-6 w-6" />
              </div>

              <span
                className={`text-[10px] font-black ${
                  isActive
                    ? "text-blue-600"
                    : theme === "dark"
                      ? "text-slate-400"
                      : "text-slate-400"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
