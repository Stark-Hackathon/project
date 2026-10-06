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

    // Block localhost and common local aliases
    if (
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "::1" ||
      hostname === "[::1]"
    ) {
      return { isValid: false, error: "SSRF Protection: Access to localhost or loopback is blocked." };
    }

    // Check IPv4 private and link-local ranges
    const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const octet1 = parseInt(ipv4Match[1] ?? "0", 10);
      const octet2 = parseInt(ipv4Match[2] ?? "0", 10);

      // 10.0.0.0/8 (Private RFC1918)
      if (octet1 === 10) {
        return { isValid: false, error: "SSRF Protection: Access to private network (10.0.0.0/8) is blocked." };
      }

      // 172.16.0.0/12 (Private RFC1918: 172.16 - 172.31)
      if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) {
        return { isValid: false, error: "SSRF Protection: Access to private network (172.16.0.0/12) is blocked." };
      }

      // 192.168.0.0/16 (Private RFC1918)
      if (octet1 === 192 && octet2 === 168) {
        return { isValid: false, error: "SSRF Protection: Access to private network (192.168.0.0/16) is blocked." };
      }

      // 169.254.0.0/16 (Link-local & AWS/GCP/Azure Cloud Metadata 169.254.169.254)
      if (octet1 === 169 && octet2 === 254) {
        return { isValid: false, error: "SSRF Protection: Access to cloud metadata or link-local address is blocked." };
      }

      // 127.0.0.0/8 (Loopback range)
      if (octet1 === 127) {
        return { isValid: false, error: "SSRF Protection: Access to loopback range is blocked." };
      }
    }

    return { isValid: true };
  }
}
