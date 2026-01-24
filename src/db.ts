import { encodeBase64Url, encodeHex } from "@std/encoding";
import { crypto } from "@std/crypto/crypto";

export async function generateShortCode(longUrl: string) {

    try {
        new URL(longUrl);
    } catch (error) {
        console.log(error);
        throw new Error("Invalid URL provided");
    }

    // Generate a unique identifier for the URL
    const urlData = new TextEncoder().encode(longUrl + Date.now());
    const hash = await crypto.subtle.digest("SHA-256", urlData);
    const hashArray = new Uint8Array(hash);
    const hashHex = encodeHex(hashArray);

    // Take the first 8 characters of the hash for the short URL
    const shortCode = encodeBase64Url(hashHex.slice(0, 8));

    return shortCode;
}

const kv = await Deno.openKv();

export type ShortLink = {
    shortCode: string;
    longUrl: string;
    createdAt: number;
    userId: string;
    clickCount: number;
    lastClickEvent?: string;
}

export type ClickAnalytics = {
  shortUrl: string;
  createdAt: number;
  ipAddress: string;
  userAgent: string;
  country?: string;
};


export async function storeShortLink(longUrl: string, shortCode: string, userId: string) {
    const shortLinkKey = ["shortlinks", shortCode];
    const data: ShortLink = {
        shortCode,
        longUrl,
        userId,
        createdAt: Date.now(),
        clickCount: 0,
    };

    const res = await kv.set(shortLinkKey, data);

    if (!res.ok) {
        // Handle errors
    }

    return res;
}

export async function getClickEvent(shortCode: string, clickId: number) {
  const analytics = await kv.get<ClickAnalytics>([
    "analytics",
    shortCode,
    clickId,
  ]);
  return analytics.value;
}

export async function getShortLink(shortCode: string) {
    const link = await kv.get<ShortLink>(["shortlinks", shortCode]);
    return link.value;
}

export async function getAllShortLinks() {
  const links: ShortLink[] = [];

  // List all entries with the "shortlinks" prefix
  const iter = kv.list<ShortLink>({ prefix: ["shortlinks"] });

  for await (const entry of iter) {
    links.push(entry.value);
  }

  return links;
}

export type GitHubUser = {
    login: string; // username
    avatar_url: string;
    html_url: string;
};


export async function storeUser(sessionId: string, userData: GitHubUser) {
    const key = ["sessions", sessionId];
    const res = await kv.set(key, userData);
    return res;
}

export async function getUser(sessionId: string) {
    const key = ["sessions", sessionId];
    const res = await kv.get<GitHubUser>(key);
    return res.value;
}

export async function getUserLinks(userId: string) {
  const list = kv.list<ShortLink>({ prefix: ["shortlinks"] });
  const allLinks = await Array.fromAsync(list);
  return allLinks.map(v => v.value).filter(v => v.userId === userId);
}

export async function incrementClickCount(
  shortCode: string,
  data?: Partial<ClickAnalytics>,
) {
  const shortLinkKey = ["shortlinks", shortCode];
  const shortLink = await kv.get(shortLinkKey);
  const shortLinkData = shortLink.value as ShortLink;

  const newClickCount = shortLinkData?.clickCount + 1;

  const analyicsKey = ["analytics", shortCode, newClickCount];
  const analyticsData = {
    shortCode,
    createdAt: Date.now(),
    ...data,
  };

  const res = await kv.atomic()
    .check(shortLink)
    .set(shortLinkKey, {
      ...shortLinkData,
      clickCount: newClickCount,
    })
    .set(analyicsKey, analyticsData)
    .commit();

  if (!res.ok) {
    console.error("Error recording click!");
  }

  return res;
}

export function watchShortLink(shortCode: string) {
  const shortLinkKey = ["shortlinks", shortCode];
  const shortLinkStream = kv.watch<ShortLink[]>([shortLinkKey]).getReader();
  return shortLinkStream;
}