
import type { ReactNode } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Home from "./pages/home";
import CategoryAds from "./pages/category-ads";
import AdDetail from "./pages/ad-detail";
import Post from "./pages/post";
import Profile from "./pages/profile";
import MyAds from "./pages/my-ads";
import SupportPage from "./pages/support";
import NotFound from "./pages/not-found";
import StoresPage from "./pages/stores";
import StoreDetailPage from "./pages/stores/detail";
import StoreDashboardPage from "./pages/stores/dashboard";

import BottomNav from "./components/bottom-nav";
import { Toaster as SonnerToaster } from "./components/ui/sonner";
import { Toaster as RadixToaster } from "./components/ui/toaster";

import AdminPanel from "./pages/admin/admin-panel";
import { CategoryManager } from "./pages/admin/category-manager";
import { AdModeration } from "./pages/admin/ad-moderation";
import { BannerManager } from "./pages/admin/banner-manager";
import { UserManager } from "./pages/admin/user-manager";
import { AdminStats } from "./pages/admin/admin-stats";
import SiteSettingsPage from "./pages/admin/site-settings";
import NotificationManager from "./pages/admin/notification-manager";
import SupportManager from "./pages/admin/support-manager";
import VipManager from "./pages/admin/vip-manager";
import ActivityLog from "./pages/admin/activity-log";
import DataTools from "./pages/admin/data-tools";

import { AuthProvider, useAuth } from "./lib/auth-context";
import { AppSettingsProvider, useAppSettings } from "./lib/app-settings";

function AdminRoute({ children }: { children: ReactNode }) {
  const { isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Жүктелуде…
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppLayout() {
  const { theme } = useAppSettings();

  return (
    <div
      className={`min-h-screen pb-20 font-sans antialiased selection:bg-blue-500 selection:text-white ${
        theme === "dark"
          ? "bg-gray-950 text-gray-100"
          : "bg-gray-50 text-gray-900"
      }`}
    >
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ads" element={<CategoryAds />} />
        <Route path="/ad/:id" element={<AdDetail />} />
        <Route path="/post" element={<Post />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/my-ads" element={<MyAds />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/stores" element={<StoresPage />} />
        <Route path="/stores/:storeId" element={<StoreDetailPage />} />
        <Route path="/store/dashboard" element={<StoreDashboardPage />} />

        <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
        <Route path="/admin/categories" element={<AdminRoute><CategoryManager /></AdminRoute>} />
        <Route path="/admin/moderation" element={<AdminRoute><AdModeration /></AdminRoute>} />
        <Route path="/admin/banners" element={<AdminRoute><BannerManager /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><UserManager /></AdminRoute>} />
        <Route path="/admin/stats" element={<AdminRoute><AdminStats /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><SiteSettingsPage /></AdminRoute>} />
        <Route path="/admin/notifications" element={<AdminRoute><NotificationManager /></AdminRoute>} />
        <Route path="/admin/support" element={<AdminRoute><SupportManager /></AdminRoute>} />
        <Route path="/admin/vip" element={<AdminRoute><VipManager /></AdminRoute>} />
        <Route path="/admin/activity" element={<AdminRoute><ActivityLog /></AdminRoute>} />
        <Route path="/admin/data" element={<AdminRoute><DataTools /></AdminRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>

      <BottomNav />
      <SonnerToaster theme={theme} position="top-center" richColors />
      <RadixToaster />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppSettingsProvider>
        <Router>
          <AppLayout />
        </Router>
      </AppSettingsProvider>
    </AuthProvider>
  );
}
