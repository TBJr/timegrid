"use client";

const PBKDF2_ITERATIONS = 150_000;
const KEY_LENGTH_BITS = 256;

function bytesToBase64Url(bytes: Uint8Array) {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

function toArrayBuffer(bytes: Uint8Array) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function deriveKey(password: string, salt: Uint8Array) {
  const passwordKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: toArrayBuffer(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256"
    },
    passwordKey,
    { name: "AES-GCM", length: KEY_LENGTH_BITS },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptShareQuery(query: string, password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv: toArrayBuffer(iv) }, key, new TextEncoder().encode(query));
  return bytesToBase64Url(
    new TextEncoder().encode(
      JSON.stringify({
        v: 1,
        s: bytesToBase64Url(salt),
        i: bytesToBase64Url(iv),
        c: bytesToBase64Url(new Uint8Array(ciphertext))
      })
    )
  );
}

export async function decryptShareQuery(payload: string, password: string) {
  const decoded = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload))) as {
    v: number;
    s: string;
    i: string;
    c: string;
  };
  if (decoded.v !== 1) throw new Error("Unsupported protected link version");
  const salt = base64UrlToBytes(decoded.s);
  const iv = base64UrlToBytes(decoded.i);
  const key = await deriveKey(password, salt);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: toArrayBuffer(iv) }, key, toArrayBuffer(base64UrlToBytes(decoded.c)));
  return new TextDecoder().decode(plaintext);
}
