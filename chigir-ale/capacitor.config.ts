/**
 * Chigir Ale - Capacitor Cross-Platform Configuration
 * Spec: Section 43 (Capacitor Architecture) & Section 127 (Web and Mobile Relationship)
 */

export interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  bundledWebRuntime?: boolean;
  server?: {
    url?: string;
    cleartext?: boolean;
    androidScheme?: string;
    iosScheme?: string;
  };
  plugins?: Record<string, Record<string, unknown>>;
}

const config: CapacitorConfig = {
  appId: "com.chigirale.app",
  appName: "Chigir Ale",
  webDir: "public",
  bundledWebRuntime: false,
  server: {
    androidScheme: "https",
    iosScheme: "https",
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#059669",
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
