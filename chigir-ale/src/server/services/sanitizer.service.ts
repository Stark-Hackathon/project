/**
 * Chigir Ale - Input Validation, HTML Sanitization & SSRF Defense Service
 * Spec: Section 79 (Security Architecture), Section 80 (Validation), Section 83 (Media Security)
 */

export class SanitizerService {
  /**
   * Strip unsafe HTML tags, scripts, and javascript: event attributes from user text.
   * Preserves normal punctuation, emojis, and multiline formatting.
   */
  static sanitizeText(input: string): string {
    if (!input || typeof input !== "string") return "";

    let sanitized = input;

    // Remove script tags and contents
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    // Remove style tags and contents
    sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
    // Remove iframe, object, embed, form, link, meta tags
    sanitized = sanitized.replace(/<\/?(?:iframe|object|embed|form|link|meta|applet)\b[^>]*>/gi, "");
    // Remove javascript: and data: pseudo-protocols in href/src
    sanitized = sanitized.replace(/(href|src)\s*=\s*['"]?(?:javascript|data):[^'">\s]*/gi, "");
    // Remove inline event handlers (onerror, onload, onclick, etc.)
    sanitized = sanitized.replace(/\bon\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, "");
    // Remove any remaining raw HTML tags
    sanitized = sanitized.replace(/<[^>]+>/g, "");

    return sanitized.trim();
  }

  /**
   * Sanitize a filename to prevent path traversal and shell injection.
   * Strips '../', directory separators, and control characters.
   */
  static sanitizeFilename(filename: string): string {
    if (!filename || typeof filename !== "string") return "file";

    // Strip directory traversal patterns
    let clean = filename.replace(/(?:\.\.[\\/])+/g, "");
    clean = clean.replace(/[\0\r\n\t]/g, "");
    clean = clean.replace(/[/\\]+/g, "_");
    clean = clean.replace(/[^a-zA-Z0-9._-]+/g, "_");

    if (!clean || clean === "." || clean === "..") {
      clean = "attachment";
    }

    return clean;
  }

  /**
   * SSRF Defense: Validate external URLs before server-side fetching (e.g. webhooks, geocoding, external APIs).
   * Blocks localhost, private subnets (RFC 1918), link-local addresses, and cloud metadata IPs.
   */
  static validateExternalUrl(urlString: string): { isValid: boolean; error?: string } {
    if (!urlString || typeof urlString !== "string") {
      return { isValid: false, error: "URL string is required." };
    }

    let parsed: URL;
    try {
      parsed = new URL(urlString);
    } catch {
      return { isValid: false, error: "Malformed URL." };
    }

    // Only allow HTTP/HTTPS
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { isValid: false, error: `Disallowed protocol: ${parsed.protocol}` };
    }

    const hostname = parsed.hostname.toLowerCase().trim();
    const cleanHost = hostname.replace(/^\[|\]$/g, "");

    // Block localhost and common local aliases
    if (
      cleanHost === "localhost" ||
      cleanHost.endsWith(".localhost") ||
      cleanHost.endsWith(".local") ||
      cleanHost === "127.0.0.1" ||
      cleanHost === "0.0.0.0" ||
      cleanHost === "::1" ||
      cleanHost === "::"
    ) {
      return { isValid: false, error: "SSRF Protection: Access to localhost or loopback is blocked." };
    }

    // Check IPv6 private/link-local/mapped
    if (cleanHost.includes(":")) {
      if (
        cleanHost.startsWith("fe80:") ||
        cleanHost.startsWith("fc00:") ||
        cleanHost.startsWith("fd") ||
        cleanHost.startsWith("::ffff:127.") ||
        cleanHost.startsWith("::ffff:10.") ||
        cleanHost.startsWith("::ffff:192.168.") ||
        cleanHost.startsWith("::ffff:172.") ||
        cleanHost.startsWith("::ffff:169.254.")
      ) {
        return { isValid: false, error: "SSRF Protection: Access to private or local IPv6 range is blocked." };
      }
    }

    // Check IPv4 (supports standard dot-decimal, octal, hex, and single 32-bit dword integers)
    const ipv4 = SanitizerService.parseIpv4Address(cleanHost);
    if (ipv4) {
      const [o1, o2] = ipv4;

      // 0.0.0.0/8
      if (o1 === 0) {
        return { isValid: false, error: "SSRF Protection: Access to non-routable 0.0.0.0/8 is blocked." };
      }
      // 10.0.0.0/8 (Private RFC1918)
      if (o1 === 10) {
        return { isValid: false, error: "SSRF Protection: Access to private network (10.0.0.0/8) is blocked." };
      }
      // 172.16.0.0/12 (Private RFC1918: 172.16 - 172.31)
      if (o1 === 172 && o2 >= 16 && o2 <= 31) {
        return { isValid: false, error: "SSRF Protection: Access to private network (172.16.0.0/12) is blocked." };
      }
      // 192.168.0.0/16 (Private RFC1918)
      if (o1 === 192 && o2 === 168) {
        return { isValid: false, error: "SSRF Protection: Access to private network (192.168.0.0/16) is blocked." };
      }
      // 169.254.0.0/16 (Link-local & AWS/GCP/Azure Cloud Metadata 169.254.169.254)
      if (o1 === 169 && o2 === 254) {
        return { isValid: false, error: "SSRF Protection: Access to cloud metadata or link-local address is blocked." };
      }
      // 127.0.0.0/8 (Loopback range)
      if (o1 === 127) {
        return { isValid: false, error: "SSRF Protection: Access to loopback range is blocked." };
      }
    }

    return { isValid: true };
  }

  private static parseIpv4Address(host: string): [number, number, number, number] | null {
    // Single 32-bit integer format (e.g. 2130706433 or 0x7f000001)
    if (/^(0x[0-9a-fA-F]+|\d+)$/.test(host)) {
      const num = parseInt(host, host.startsWith("0x") || host.startsWith("0X") ? 16 : 10);
      if (!isNaN(num) && num >= 0 && num <= 0xffffffff) {
        return [
          (num >>> 24) & 0xff,
          (num >>> 16) & 0xff,
          (num >>> 8) & 0xff,
          num & 0xff,
        ];
      }
    }

    const parts = host.split(".");
    if (parts.length === 4) {
      const octets: number[] = [];
      for (const p of parts) {
        let val: number;
        if (/^0x[0-9a-fA-F]+$/i.test(p)) {
          val = parseInt(p, 16);
        } else if (/^0[0-7]+$/.test(p)) {
          val = parseInt(p, 8);
        } else if (/^\d+$/.test(p)) {
          val = parseInt(p, 10);
        } else {
          return null;
        }
        if (isNaN(val) || val < 0 || val > 255) return null;
        octets.push(val);
      }
      return [octets[0]!, octets[1]!, octets[2]!, octets[3]!];
    }

    return null;
  }
}
