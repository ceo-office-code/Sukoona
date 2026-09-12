// Set NEXT_PUBLIC_SITE_URL to the real origin when deploying.
const configured = process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === "production" ? "https://sukoona.com" : "http://localhost:3000");
export const SITE_ORIGIN = new URL(configured).origin;
export const IS_LOCAL = ["localhost", "127.0.0.1"].includes(new URL(SITE_ORIGIN).hostname);
