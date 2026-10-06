/**
 * Chigir Ale - Cross-Platform Mobile & Offline Types
 * Spec: Section 43 (Capacitor Architecture), Section 44 (Mobile Offline Behavior), Section 128 (Deep Links)
 */

export type PlatformType = "web" | "android" | "ios";

export interface NetworkStatus {
  connected: boolean;
  connectionType: "wifi" | "cellular" | "none" | "unknown";
}

export interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface NativeCameraResult {
  dataUrl?: string;
  format: string;
  sizeBytes?: number;
  fileName?: string;
}

export interface NativeShareOptions {
  title: string;
  text?: string;
  url?: string;
}

export interface IPlatformAdapter {
  readonly platform: PlatformType;
  readonly isNative: boolean;

  getNetworkStatus(): Promise<NetworkStatus>;
  onNetworkChange(callback: (status: NetworkStatus) => void): () => void;
  getCurrentPosition(options?: { enableHighAccuracy?: boolean }): Promise<GeolocationPosition>;
  takePhoto(): Promise<NativeCameraResult | null>;
  pickPhoto(): Promise<NativeCameraResult | null>;
  share(options: NativeShareOptions): Promise<boolean>;
  vibrate(durationMs?: number): Promise<void>;
  getStorageItem(key: string): Promise<string | null>;
  setStorageItem(key: string, value: string): Promise<void>;
  removeStorageItem(key: string): Promise<void>;
}

export type QueueItemStatus =
  | "DRAFT"
  | "PENDING_UPLOAD"
  | "UPLOADING_MEDIA"
  | "CREATING_REPORT"
  | "SUBMITTED"
  | "FAILED";

export interface LocalMediaItem {
  localUri: string;
  mimeType: string;
  fileName: string;
  uploadedUrl?: string;
}

export interface PendingReportQueueItem {
  id: string;
  createdAt: number;
  updatedAt: number;
  status: QueueItemStatus;
  formData: {
    categoryId: string;
    title: string;
    description: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    latitude?: number;
    longitude?: number;
    locationAccuracy?: number;
    formattedAddress?: string;
    administrativeArea?: string;
  };
  localMedia: LocalMediaItem[];
  retryCount: number;
  lastError?: string;
  serverReportId?: string;
  serverPublicReference?: string;
}

export interface ReportDraft {
  lastUpdated: number;
  step: number;
  formData: {
    categoryId?: string;
    title?: string;
    description?: string;
    severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    latitude?: number;
    longitude?: number;
    formattedAddress?: string;
    administrativeArea?: string;
    mediaUrls?: string[];
  };
}

export interface CachedReport {
  id: string;
  publicReference: string;
  title: string;
  description: string;
  status: string;
  severity: string;
  formattedAddress?: string;
  categoryName: string;
  cachedAt: number;
}
