export const allowedEmbedHosts = [
  "youtube.com",
  "www.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "youtu.be",
  "player.vimeo.com",
  "vimeo.com",
  "docs.google.com",
  "drive.google.com",
  "canva.com",
  "www.canva.com",
  "genially.com",
  "view.genially.com",
  "open.spotify.com",
  "quizlet.com",
  "www.quizlet.com",
  "wordwall.net",
  "www.wordwall.net",
  "liveworksheets.com",
  "www.liveworksheets.com",
  "learningapps.org",
];

export const supportedEmbedDomains =
  "YouTube, Google Slides/Drive, Canva, Genially, Quizlet, Wordwall, and Liveworksheets";

export const unsupportedEmbedUrlMessage = `Embed URL is not supported. Use trusted embeddable URLs only. Supported platforms include ${supportedEmbedDomains}.`;
export const untrustedEmbedSourceMessage =
  "This site is not currently trusted for embeds. Add the domain in Admin Settings -> Trusted Embed Sources, or use External URL instead.";

export function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function normalizeEmbedUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();

    if (
      (host === "youtube.com" || host === "www.youtube.com") &&
      url.pathname === "/watch"
    ) {
      const videoId = url.searchParams.get("v");

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    if (host === "youtu.be") {
      const videoId = url.pathname.split("/").filter(Boolean)[0];

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    return value;
  } catch {
    return value;
  }
}

export function extractEmbedSrc(value: string) {
  const input = value.trim().replace(/;+$/g, "").trim();

  if (!input) {
    return null;
  }

  if (/javascript:/i.test(input) || /data:/i.test(input) || /<script/i.test(input)) {
    return null;
  }

  const iframeSrcMatch = input.match(/<iframe[^>]*\ssrc=["']([^"']+)["'][^>]*>/i);
  const candidate = (iframeSrcMatch?.[1] || input).trim().replace(/;+$/g, "").trim();

  try {
    const url = new URL(normalizeEmbedUrl(candidate));

    if (url.protocol !== "https:") {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

export function normalizeTrustedDomain(value: string) {
  const input = value.trim().toLowerCase().replace(/^https?:\/\//, "");
  return input.split("/")[0].replace(/:+$/, "").replace(/;+$/, "");
}

export function isTrustedEmbedUrlForHosts(value: string, hosts: string[]) {
  const extractedUrl = extractEmbedSrc(value);

  if (!extractedUrl) {
    return false;
  }

  try {
    const url = new URL(extractedUrl);
    const hostname = url.hostname.toLowerCase();

    return hosts
      .map(normalizeTrustedDomain)
      .filter(Boolean)
      .some(
        (host) => hostname === host || hostname.endsWith(`.${host}`),
      );
  } catch {
    return false;
  }
}

export function isAllowedEmbedUrl(value: string) {
  return isTrustedEmbedUrlForHosts(value, allowedEmbedHosts);
}

export function sanitizeHtml(input: string | null | undefined) {
  if (!input) {
    return "";
  }

  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

export function materialTypeFromMime(mimeType: string) {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("video/")) return "video";
  return "external_url";
}
