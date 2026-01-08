import { encodeBase64Url, encodeHex } from "jsr:@std/encoding";
import { crypto } from "jsr:@std/crypto/crypto";

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