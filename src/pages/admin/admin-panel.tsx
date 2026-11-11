
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  FolderTree,
  Megaphone,
  Users,
  Image as ImageIcon,
  BarChart3,
  ShieldCheck,
  Settings,
  Bell,
  LifeBuoy,
  Crown,
  History,
  Database,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { CategoryManager } from "./category-manager";
import { AdminStats } from "./admin-stats";
import { AdModeration } from "./ad-moderation";
import { UserManager } from "./user-manager";
import { BannerManager } from "./banner-manager";
import SiteSettingsPage from "./site-settings";
import NotificationManager from "./notification-manager";
import SupportManager from "./support-manager";
import VipManager from "./vip-manager";
import ActivityLog from "./activity-log";
import DataTools from "./data-tools";

const tabs = [
  { id: "stats", label: "Статистика", icon: BarChart3 },
  { id: "categories", label: "Категориялар", icon: FolderTree },
  { id: "ads", label: "Жарнамалар", icon: Megaphone },
  { id: "users", label: "Пайдаланушылар", icon: Users },
  { id: "banners", label: "Баннерлер", icon: ImageIcon },
  { id: "settings", label: "Сайт баптауы", icon: Settings },
  { id: "notifications", label: "Хабарламалар", icon: Bell },
  { id: "support", label: "Шағым/қолдау", icon: LifeBuoy },
  { id: "vip", label: "VIP/тариф", icon: Crown },
  { id: "activity", label: "Әрекет журналы", icon: History },
  { id: "data", label: "Backup", icon: Database },
];

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("stats");
  const navigate = useNavigate();

  const renderContent = () => {
    switch (activeTab) {
      case "stats":
        return <AdminStats />;

      case "categories":
        return <CategoryManager />;

      case "ads":
        return <AdModeration />;

      case "users":
        return <UserManager />;

      case "banners":
        return <BannerManager />;

      case "settings":
        return <SiteSettingsPage />;

      case "notifications":
        return <NotificationManager />;

      case "support":
        return <SupportManager />;

      case "vip":
        return <VipManager />;

      case "activity":
        return <ActivityLog />;

      case "data":
        return <DataTools />;

      default:
        return <CategoryManager />;
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-5xl bg-[#fcfcfd] px-4 pt-4 text-slate-900">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-100 bg-white text-slate-600 shadow-sm transition-transform active:scale-90"
          aria-label="Басты бетке қайту"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-amber-50 p-2 shadow-inner">
            <ShieldCheck className="h-5 w-5 text-amber-500" />
          </div>

          <h1 className="text-xl font-black tracking-tight text-slate-800">
            Admin Console
          </h1>
        </div>
      </div>

      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex shrink-0 items-center gap-2 rounded-2xl px-5 py-3 text-[11px] font-bold transition-all ${
              activeTab === tab.id
                ? "scale-105 bg-blue-600 text-white shadow-lg shadow-blue-100"
                : "border border-slate-100 bg-white text-slate-400 hover:border-slate-200"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="pb-24"
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
