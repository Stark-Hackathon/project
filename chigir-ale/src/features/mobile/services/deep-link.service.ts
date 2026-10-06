/**
 * Chigir Ale - Deep Link Resolution Service
 * Spec: Section 128 — Deep Links (chigir:// and universal app links)
 * Handles custom scheme URLs and push notification navigation.
 */

export interface ResolvedDeepLink {
  rawUrl: string;
  targetRoute: string;
  action: "VIEW_REPORT" | "AUTHORITY_VIEW" | "VIEW_MAP" | "NEW_REPORT" | "VIEW_NOTIFICATIONS" | "CUSTOM";
  reportReference?: string;
  params: Record<string, string>;
}

export class DeepLinkService {
  private static readonly SCHEMES = ["chigir://", "chigir-ale://"];
  private static readonly UNIVERSAL_DOMAINS = ["chigir.app", "chigir.ale", "localhost"];

  /**
   * Parse any deep link or universal link URL into an internal Next.js App Router route.
   */
  static parse(url: string): ResolvedDeepLink | null {
    if (!url || typeof url !== "string") return null;

    const trimmed = url.trim();

    // 1. Custom URI scheme: chigir://...
    for (const scheme of DeepLinkService.SCHEMES) {
      if (trimmed.startsWith(scheme)) {
        return DeepLinkService.parseCustomScheme(trimmed, scheme);
      }
    }

    // 2. HTTP / HTTPS Universal Links: https://chigir.app/...
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return DeepLinkService.parseUniversalLink(trimmed);
    }

    return null;
  }

  private static parseCustomScheme(url: string, scheme: string): ResolvedDeepLink {
    const pathAndQuery = url.slice(scheme.length);
    const [pathPart, queryPart] = pathAndQuery.split("?");
    const pathSegments = (pathPart || "").split("/").filter(Boolean);
    const params = DeepLinkService.parseQuery(queryPart);

    // e.g. chigir://report/CHI-2026-000001 or chigir://reports/CHI-2026-000001
    if ((pathSegments[0] === "report" || pathSegments[0] === "reports") && pathSegments[1]) {
      const ref = pathSegments[1].toUpperCase();
      return {
        rawUrl: url,
        targetRoute: `/reports/${ref}`,
        action: "VIEW_REPORT",
        reportReference: ref,
        params,
      };
    }

    // e.g. chigir://authority/reports/CHI-2026-000001
    if (pathSegments[0] === "authority" && pathSegments[1] === "reports" && pathSegments[2]) {
      const ref = pathSegments[2].toUpperCase();
      return {
        rawUrl: url,
        targetRoute: `/authority/reports/${ref}`,
        action: "AUTHORITY_VIEW",
        reportReference: ref,
        params,
      };
    }

    // e.g. chigir://map
    if (pathSegments[0] === "map") {
      const queryString = queryPart ? `?${queryPart}` : "";
      return {
        rawUrl: url,
        targetRoute: `/map${queryString}`,
        action: "VIEW_MAP",
        params,
      };
    }

    // e.g. chigir://new-report or chigir://report/new
    if (pathSegments[0] === "new-report" || (pathSegments[0] === "report" && pathSegments[1] === "new")) {
      return {
        rawUrl: url,
        targetRoute: "/citizen/report/new",
        action: "NEW_REPORT",
        params,
      };
    }

    // e.g. chigir://notifications
    if (pathSegments[0] === "notifications") {
      return {
        rawUrl: url,
        targetRoute: "/notifications",
        action: "VIEW_NOTIFICATIONS",
        params,
      };
    }

    return {
      rawUrl: url,
      targetRoute: `/${pathSegments.join("/")}`,
      action: "CUSTOM",
      params,
    };
  }

  private static parseUniversalLink(url: string): ResolvedDeepLink | null {
    try {
      const parsed = new URL(url);
      const isKnownDomain = DeepLinkService.UNIVERSAL_DOMAINS.some((d) => parsed.hostname.includes(d));

      if (!isKnownDomain) return null;

      const pathSegments = parsed.pathname.split("/").filter(Boolean);
      const params = Object.fromEntries(parsed.searchParams.entries());

      if (pathSegments[0] === "reports" && pathSegments[1]) {
        const ref = pathSegments[1].toUpperCase();
        return {
          rawUrl: url,
          targetRoute: `/reports/${ref}`,
          action: "VIEW_REPORT",
          reportReference: ref,
          params,
        };
      }

      if (pathSegments[0] === "authority" && pathSegments[1] === "reports" && pathSegments[2]) {
        const ref = pathSegments[2].toUpperCase();
        return {
          rawUrl: url,
          targetRoute: `/authority/reports/${ref}`,
          action: "AUTHORITY_VIEW",
          reportReference: ref,
          params,
        };
      }

      return {
        rawUrl: url,
        targetRoute: parsed.pathname + parsed.search,
        action: "CUSTOM",
        params,
      };
    } catch {
      return null;
    }
  }

  private static parseQuery(queryString?: string): Record<string, string> {
    if (!queryString) return {};
    const result: Record<string, string> = {};
    const pairs = queryString.split("&");
    for (const pair of pairs) {
      const [k, v] = pair.split("=");
      if (k) {
        result[decodeURIComponent(k)] = decodeURIComponent(v || "");
      }
    }
    return result;
  }

  /**
   * Generate canonical mobile deep links.
   */
  static generateReportDeepLink(publicReference: string): string {
    return `chigir://report/${publicReference.toUpperCase()}`;
  }

  static generateUniversalLink(publicReference: string, baseDomain: string = "chigir.app"): string {
    return `https://${baseDomain}/reports/${publicReference.toUpperCase()}`;
  }

  /**
   * Handle push notification tap payload (Spec §128: Push notification taps should open the relevant report).
   */
  static resolveNotificationRoute(notificationData: Record<string, unknown>): string {
    if (typeof notificationData.deepLink === "string") {
      const resolved = DeepLinkService.parse(notificationData.deepLink);
      if (resolved) return resolved.targetRoute;
    }

    if (typeof notificationData.publicReference === "string") {
      return `/reports/${notificationData.publicReference.toUpperCase()}`;
    }

    return "/notifications";
  }
}
