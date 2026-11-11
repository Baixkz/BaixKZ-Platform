
// ==========================================
// BAIX KZ — ортақ типтер
// ==========================================

export type AdStatus =
  | "active"
  | "moderation"
  | "rejected"
  | "sold"
  | "hidden";

export type UserDeletionStatus =
  | "none"
  | "requested"
  | "approved"
  | "held";

export type AdType = "sell" | "buy";

export interface Category {
  id: string;
  name: string;
  nameKk?: string;
  nameRu?: string;
  parentId: string | null;
  icon: string;
  color: string;
  order: number;
  active?: boolean;
}

export interface Ad {
  id: string;
  title: string;
  description: string;
  price: number;
  status: AdStatus;
  prevStatus?: AdStatus;
  deleteAt?: unknown;
  adType?: AdType;
  isVip: boolean;
  vipUntil?: unknown;
  categoryPath: string[];
  userId?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  images: string[];
  city: string;
  ownerName: string;
  phone: string;
  ownerPhone?: string;
}

export interface NewAdInput {
  title: string;
  description: string;
  price: number;
  adType: AdType;
  categoryPath: string[];
  images: string[];
  city: string;
  ownerName: string;
  phone: string;
  userId: string;
}

export interface Banner {
  id: string;
  imageUrl: string;
  link?: string;
  page: "home" | "posting" | "profile";
  active: boolean;
  order: number;
  createdAt?: unknown;
}
