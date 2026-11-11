import { auth, db, MASTER_ADMIN_UID } from "./firebase";
import { compressImageToDataUrl } from "./images";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  serverTimestamp,
  orderBy,
  limit,
  writeBatch,
  Timestamp,
  deleteField,
  type WriteBatch,
} from "firebase/firestore";

export { db };

import type { Ad, Banner, Category, NewAdInput } from "../types";
export type { Ad, AdStatus, Banner, Category, NewAdInput } from "../types";

// ==========================================
// USERS
// ==========================================

export async function getAllUsers(): Promise<any[]> {
  try {
    const snap = await getDocs(collection(db, "users"));
    return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
  } catch (error) {
    console.error("Error getting users:", error);
    return [];
  }
}

export async function updateUser(
  userId: string,
  data: Record<string, unknown>
): Promise<void> {
  if (!userId) throw new Error("User document ID is required");

  try {
    await updateDoc(doc(db, "users", userId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("UpdateUser error:", error);
    throw error;
  }
}

// ==========================================
// CATEGORIES
// ==========================================

export async function getAllCategories(): Promise<Category[]> {
  try {
    const snap = await getDocs(collection(db, "categories"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category));
  } catch (error) {
    console.error("Error getting all categories:", error);
    return [];
  }
}

export async function getCategoryById(id: string): Promise<Category | null> {
  if (!id) return null;

  try {
    const snap = await getDoc(doc(db, "categories", id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Category;
  } catch {
    return null;
  }
}

export async function getCategories(
  parentId: string | null = null
): Promise<Category[]> {
  try {
    const q = query(
      collection(db, "categories"),
      where("parentId", "==", parentId),
      orderBy("order", "asc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category));
  } catch {
    const qRaw = query(
      collection(db, "categories"),
      where("parentId", "==", parentId)
    );
    const snap = await getDocs(qRaw);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category));
  }
}

export async function createCategory(data: any) {
  return addDoc(collection(db, "categories"), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function updateCategory(id: string, data: any) {
  return updateDoc(doc(db, "categories", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCategory(id: string) {
  return deleteDoc(doc(db, "categories", id));
}

// ==========================================
// ADS AND STATISTICS
// ==========================================

export async function getAdStats() {
  try {
    const [adsSnap, usersSnap, catsSnap] = await Promise.all([
      getDocs(collection(db, "ads")),
      getDocs(collection(db, "users")),
      getDocs(collection(db, "categories")),
    ]);

    const ads = adsSnap.docs.map((d) => d.data() as Partial<Ad>);

    return {
      total: ads.length,
      active: ads.filter((a) => a.status === "active").length,
      moderation: ads.filter((a) => a.status === "moderation").length,
      vip: ads.filter((a) => a.isVip === true).length,
      users: usersSnap.size,
      categories: catsSnap.size,
    };
  } catch (error) {
    console.error("GetAdStats error:", error);
    return {
      total: 0,
      active: 0,
      moderation: 0,
      vip: 0,
      users: 0,
      categories: 0,
    };
  }
}

export async function getAdById(id: string): Promise<Ad | null> {
  if (!id) return null;

  try {
    const snap = await getDoc(doc(db, "ads", id));
    if (!snap.exists()) return null;
    return normalizeAd({ id: snap.id, ...snap.data() } as Ad);
  } catch {
    return null;
  }
}

export async function createAd(data: NewAdInput) {
  return addDoc(collection(db, "ads"), {
    ...data,
    isVip: false,
    status: "moderation",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateAd(id: string, data: Partial<Ad>) {
  await updateDoc(doc(db, "ads", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
  await logAdminAction("ad_updated", {
    adId: id,
    fields: Object.keys(data),
  });
}

export async function deleteAd(id: string) {
  await deleteDoc(doc(db, "ads", id));
  await logAdminAction("ad_deleted", { adId: id });
}

export async function getAdsByCategory(categoryId: string): Promise<Ad[]> {
  const q = query(
    collection(db, "ads"),
    where("categoryPath", "array-contains", categoryId),
    where("status", "==", "active")
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) =>
    normalizeAd({ id: d.id, ...d.data() } as Ad)
  );
}

function toMillis(value: unknown): number {
  if (!value) return 0;

  const timestamp = value as { toMillis?: () => number };

  if (typeof timestamp.toMillis === "function") {
    return timestamp.toMillis();
  }

  const parsed = new Date(value as string | number | Date).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function normalizeAd(ad: Ad): Ad {
  if (
    ad.isVip &&
    ad.vipUntil &&
    toMillis(ad.vipUntil) > 0 &&
    toMillis(ad.vipUntil) <= Date.now()
  ) {
    return { ...ad, isVip: false };
  }

  return ad;
}

export async function getReportsByUser(
  userId: string
): Promise<Array<Record<string, unknown> & { id: string }>> {
  if (!userId) return [];

  const snap = await getDocs(
    query(collection(db, "reports"), where("userId", "==", userId))
  );

  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getAdsByUser(userId: string): Promise<Ad[]> {
  if (!userId) return [];

  const snap = await getDocs(
    query(collection(db, "ads"), where("userId", "==", userId))
  );

  const data = snap.docs.map((d) =>
    normalizeAd({ id: d.id, ...d.data() } as Ad)
  );

  return data.sort(
    (a, b) => toMillis(b.createdAt) - toMillis(a.createdAt)
  );
}

const ADS_PAGE_LIMIT = 100;

export async function getAds(
  statusOrIgnored?: unknown,
  statusFilter?: string,
  maxCount: number = ADS_PAGE_LIMIT
): Promise<Ad[]> {
  const adsRef = collection(db, "ads");
  const finalStatus =
    statusFilter ||
    (typeof statusOrIgnored === "string" ? statusOrIgnored : undefined);

  try {
    const q = finalStatus
      ? query(
          adsRef,
          where("status", "==", finalStatus),
          orderBy("createdAt", "desc"),
          limit(maxCount)
        )
      : query(adsRef, orderBy("createdAt", "desc"), limit(maxCount));

    const snap = await getDocs(q);

    return snap.docs.map((d) =>
      normalizeAd({ id: d.id, ...d.data() } as Ad)
    );
  } catch (error) {
    console.warn("getAds: fallback sorting is used.", error);

    const fallbackQuery = finalStatus
      ? query(adsRef, where("status", "==", finalStatus))
      : adsRef;

    const snap = await getDocs(fallbackQuery);

    const data = snap.docs.map((d) =>
      normalizeAd({ id: d.id, ...d.data() } as Ad)
    );

    return data
      .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
      .slice(0, maxCount);
  }
}

// ==========================================
// BANNERS
// ==========================================

export async function getBanners(): Promise<Banner[]> {
  try {
    const q = query(collection(db, "banners"), orderBy("order", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Banner));
  } catch (error) {
    console.error("Error getting banners:", error);
    return [];
  }
}

export async function createBanner(data: any) {
  return addDoc(collection(db, "banners"), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function updateBanner(id: string, data: any) {
  if (!id) throw new Error("ID is required");

  return updateDoc(doc(db, "banners", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteBanner(id: string) {
  return deleteDoc(doc(db, "banners", id));
}

// ==========================================
// SITE SETTINGS
// ==========================================

export interface SiteSettings {
  maintenanceMode?: boolean;
  postingDisabled?: boolean;
  homeTitleKk?: string;
  homeTitleRu?: string;
  homeDescriptionKk?: string;
  homeDescriptionRu?: string;
  showBanners?: boolean;
  showCategories?: boolean;
  showWeather?: boolean;
  showPrayerTimes?: boolean;
  maxImages?: number;
  requireImage?: boolean;
  requirePhone?: boolean;
  rulesKk?: string;
  rulesRu?: string;
  updatedAt?: unknown;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const snap = await getDoc(doc(db, "siteSettings", "main"));
    return snap.exists() ? (snap.data() as SiteSettings) : {};
  } catch (error) {
    console.error("Site settings read failed:", error);
    return {};
  }
}

export async function saveSiteSettings(data: SiteSettings): Promise<void> {
  await setDoc(
    doc(db, "siteSettings", "main"),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true }
  );

  await logAdminAction("site_settings_updated", {
    keys: Object.keys(data),
  });
}

export async function getAdminCollection(
  name:
    | "notifications"
    | "reports"
    | "supportTickets"
    | "adminLogs"
    | "vipPlans"
): Promise<Array<Record<string, any>>> {
  const snap = await getDocs(
    query(collection(db, name), orderBy("createdAt", "desc"), limit(300))
  );

  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getPublicNotifications(): Promise<
  Array<Record<string, any> & { id: string }>
> {
  try {
    const snap = await getDocs(
      query(
        collection(db, "notifications"),
        where("active", "==", true),
        where("audience", "==", "all"),
        limit(20)
      )
    );

    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
      .slice(0, 5);
  } catch (error) {
    console.warn("Public notifications unavailable:", error);
    return [];
  }
}

export async function createAdminRecord(
  name:
    | "notifications"
    | "reports"
    | "supportTickets"
    | "adminLogs"
    | "vipPlans",
  data: Record<string, unknown>
): Promise<string> {
  const result = await addDoc(collection(db, name), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  if (name === "notifications" || name === "vipPlans") {
    await logAdminAction(`${name}_created`, { recordId: result.id });
  }

  return result.id;
}

export async function createAdReport(data: {
  userId: string;
  adId: string;
  reason: string;
  message?: string;
}): Promise<string> {
  const result = await addDoc(collection(db, "reports"), {
    ...data,
    type: "ad_report",
    status: "open",
    createdAt: serverTimestamp(),
  });

  return result.id;
}

export async function updateAdminRecord(
  name:
    | "notifications"
    | "reports"
    | "supportTickets"
    | "adminLogs"
    | "vipPlans",
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  await updateDoc(doc(db, name, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });

  await logAdminAction(`${name}_updated`, {
    recordId: id,
    fields: Object.keys(data),
  });
}

export async function logAdminAction(
  action: string,
  details: Record<string, unknown> = {}
): Promise<void> {
  try {
    await addDoc(collection(db, "adminLogs"), {
      action,
      details,
      createdAt: serverTimestamp(),
      actorUid: auth.currentUser?.uid || MASTER_ADMIN_UID,
    });
  } catch (error) {
    console.warn("Admin activity log failed:", error);
  }
}

export async function bulkUpdateAds(
  ids: string[],
  data: Record<string, unknown>
): Promise<void> {
  const uniqueIds = [...new Set(ids)].filter(Boolean);

  for (let i = 0; i < uniqueIds.length; i += 400) {
    const batch = writeBatch(db);

    uniqueIds.slice(i, i + 400).forEach((id) => {
      batch.update(doc(db, "ads", id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
  }

  await logAdminAction("bulk_ads_updated", {
    count: uniqueIds.length,
    fields: Object.keys(data),
  });
}

const DAY_MS = 24 * 60 * 60 * 1000;

export async function setAdVip(
  id: string,
  enabled: boolean,
  days = 30
): Promise<void> {
  const vipUntil = enabled
    ? Timestamp.fromMillis(
        Date.now() + Math.max(1, Math.min(days, 3650)) * DAY_MS
      )
    : deleteField();

  await updateDoc(doc(db, "ads", id), {
    isVip: enabled,
    vipUntil,
    updatedAt: serverTimestamp(),
  });

  await logAdminAction(enabled ? "ad_vip_enabled" : "ad_vip_disabled", {
    adId: id,
    days,
  });
}

// ==========================================
// BACKUP / RESTORE
// ==========================================

function encodeBackupValue(value: unknown): unknown {
  if (value instanceof Timestamp) {
    return {
      __baixType: "timestamp",
      seconds: value.seconds,
      nanoseconds: value.nanoseconds,
    };
  }

  if (Array.isArray(value)) {
    return value.map(encodeBackupValue);
  }

  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};

    for (const [key, child] of Object.entries(
      value as Record<string, unknown>
    )) {
      out[key] = encodeBackupValue(child);
    }

    return out;
  }

  return value;
}

function decodeBackupValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(decodeBackupValue);
  }

  if (value && typeof value === "object") {
    const row = value as Record<string, unknown>;

    if (
      row.__baixType === "timestamp" &&
      typeof row.seconds === "number" &&
      typeof row.nanoseconds === "number"
    ) {
      return new Timestamp(row.seconds, row.nanoseconds);
    }

    const out: Record<string, unknown> = {};

    for (const [key, child] of Object.entries(row)) {
      out[key] = decodeBackupValue(child);
    }

    return out;
  }

  return value;
}

export async function exportAdminData(): Promise<Record<string, unknown>> {
  const names = [
    "users",
    "categories",
    "banners",
    "ads",
    "siteSettings",
    "notifications",
    "reports",
    "supportTickets",
    "adminLogs",
    "vipPlans",
  ] as const;

  const entries = await Promise.all(
    names.map(async (name) => {
      const snap = await getDocs(collection(db, name));

      return [
        name,
        snap.docs.map((d) => ({
          id: d.id,
          ...(encodeBackupValue(d.data()) as Record<string, unknown>),
        })),
      ] as const;
    })
  );

  return {
    format: "baixkz-backup-v1",
    exportedAt: new Date().toISOString(),
    collections: Object.fromEntries(entries),
  };
}

export async function restoreAdminData(
  input: unknown
): Promise<{ restored: number }> {
  if (!input || typeof input !== "object") {
    throw new Error("Backup форматы қате");
  }

  const backup = input as {
    format?: string;
    collections?: Record<string, unknown>;
  };

  if (
    backup.format !== "baixkz-backup-v1" ||
    !backup.collections ||
    typeof backup.collections !== "object"
  ) {
    throw new Error("Қолдау көрсетілмейтін backup форматы");
  }

  const allowed = new Set([
    "users",
    "ads",
    "categories",
    "banners",
    "siteSettings",
    "notifications",
    "reports",
    "supportTickets",
    "adminLogs",
    "vipPlans",
  ]);

  let restored = 0;

  for (const [name, rawRows] of Object.entries(backup.collections)) {
    if (!allowed.has(name) || !Array.isArray(rawRows)) continue;

    for (let i = 0; i < rawRows.length; i += 400) {
      const batch = writeBatch(db);

      for (const raw of rawRows.slice(i, i + 400)) {
        if (
          !raw ||
          typeof raw !== "object" ||
          typeof (raw as { id?: unknown }).id !== "string"
        ) {
          continue;
        }

        const row = raw as Record<string, unknown> & { id: string };
        const { id, ...rawData } = row;
        const data = decodeBackupValue(rawData) as Record<string, unknown>;

        batch.set(doc(db, name, id), data, { merge: true });
        restored += 1;
      }

      await batch.commit();
    }
  }

  await logAdminAction("backup_restored", { restored });
  return { restored };
}

// ==========================================
// IMAGE UPLOAD
// ==========================================

export async function uploadImage(
  file: File,
  _path: string
): Promise<string> {
  return compressImageToDataUrl(file, {
    maxSize: 1000,
    quality: 0.7,
  });
}

// ==========================================
// ACCOUNT DELETION REQUESTS
// ==========================================

const REQUEST_DELETE_DAYS = 30;
const APPROVED_DELETE_DAYS = 7;
const BATCH_LIMIT = 400;

function deleteAtAfter(days: number): Timestamp {
  return Timestamp.fromMillis(Date.now() + days * DAY_MS);
}

async function commitInChunks(
  operations: Array<(batch: WriteBatch) => void>
): Promise<void> {
  for (let start = 0; start < operations.length; start += BATCH_LIMIT) {
    const batch = writeBatch(db);

    operations
      .slice(start, start + BATCH_LIMIT)
      .forEach((operation) => operation(batch));

    await batch.commit();
  }
}

async function getUserAdDocs(userId: string) {
  const snap = await getDocs(
    query(collection(db, "ads"), where("userId", "==", userId))
  );

  return snap.docs;
}

export async function requestUserDeletion(userId: string): Promise<void> {
  if (!userId) throw new Error("Пайдаланушы табылмады");

  if (userId === MASTER_ADMIN_UID) {
    throw new Error("Негізгі әкімшінің аккаунтын жоюға болмайды");
  }

  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) throw new Error("Профиль табылмады");

  const userData = userSnap.data();

  if (userData.blocked === true) {
    throw new Error("Бұғатталған аккаунт үшін сұраныс жіберуге болмайды");
  }

  const currentStatus = userData.deletionStatus ?? "none";

  if (currentStatus === "approved" || currentStatus === "held") {
    throw new Error("Сұраныс әкімшінің қарауында");
  }

  const deleteAt =
    currentStatus === "requested" && userData.deleteAt instanceof Timestamp
      ? userData.deleteAt
      : deleteAtAfter(REQUEST_DELETE_DAYS);

  if (currentStatus === "none") {
    await updateDoc(userRef, {
      deletionStatus: "requested",
      deletionRequestedAt: serverTimestamp(),
      deleteAt,
    });
  }

  const adDocs = await getUserAdDocs(userId);
  const operations: Array<(batch: WriteBatch) => void> = [];

  adDocs.forEach((adDoc) => {
    const status = adDoc.data().status;

    if (typeof status !== "string" || status === "hidden") return;

    operations.push((batch) =>
      batch.update(adDoc.ref, {
        status: "hidden",
        prevStatus: status,
        deleteAt,
        updatedAt: serverTimestamp(),
      })
    );
  });

  await commitInChunks(operations);
}

export async function cancelUserDeletion(userId: string): Promise<void> {
  if (!userId) throw new Error("Пайдаланушы табылмады");

  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) throw new Error("Профиль табылмады");

  if ((userSnap.data().deletionStatus ?? "none") !== "requested") {
    throw new Error("Сұранысты кері алу мүмкін емес");
  }

  const adDocs = await getUserAdDocs(userId);
  const operations: Array<(batch: WriteBatch) => void> = [];

  adDocs.forEach((adDoc) => {
    const data = adDoc.data();

    if (data.status !== "hidden" || typeof data.prevStatus !== "string") {
      return;
    }

    operations.push((batch) =>
      batch.update(adDoc.ref, {
        status: data.prevStatus,
        prevStatus: deleteField(),
        deleteAt: deleteField(),
        updatedAt: serverTimestamp(),
      })
    );
  });

  await commitInChunks(operations);

  await updateDoc(userRef, {
    deletionStatus: "none",
    deletionRequestedAt: deleteField(),
    deleteAt: deleteField(),
  });
}

export async function approveUserDeletion(userId: string): Promise<void> {
  if (!userId) throw new Error("Пайдаланушы табылмады");

  if (userId === MASTER_ADMIN_UID) {
    throw new Error("Негізгі әкімшінің аккаунтын жоюға болмайды");
  }

  const deleteAt = deleteAtAfter(APPROVED_DELETE_DAYS);
  const adDocs = await getUserAdDocs(userId);
  const operations: Array<(batch: WriteBatch) => void> = [];

  adDocs.forEach((adDoc) => {
    const status = adDoc.data().status;

    if (status === "hidden") {
      operations.push((batch) =>
        batch.update(adDoc.ref, {
          deleteAt,
          updatedAt: serverTimestamp(),
        })
      );
    } else if (typeof status === "string") {
      operations.push((batch) =>
        batch.update(adDoc.ref, {
          status: "hidden",
          prevStatus: status,
          deleteAt,
          updatedAt: serverTimestamp(),
        })
      );
    }
  });

  await commitInChunks(operations);

  await updateDoc(doc(db, "users", userId), {
    deletionStatus: "approved",
    deleteAt,
    updatedAt: serverTimestamp(),
  });
}

export async function holdUserDeletion(userId: string): Promise<void> {
  if (!userId) throw new Error("Пайдаланушы табылмады");

  const adDocs = await getUserAdDocs(userId);
  const operations: Array<(batch: WriteBatch) => void> = [];

  adDocs.forEach((adDoc) => {
    if (adDoc.data().deleteAt === undefined) return;

    operations.push((batch) =>
      batch.update(adDoc.ref, {
        deleteAt: deleteField(),
        updatedAt: serverTimestamp(),
      })
    );
  });

  await commitInChunks(operations);

  await updateDoc(doc(db, "users", userId), {
    deletionStatus: "held",
    deleteAt: deleteField(),
    updatedAt: serverTimestamp(),
  });
    }
