import { GOOGLE_DRIVE_SCOPE } from "./google-drive-backup.mjs";

const GIS_URL = "https://accounts.google.com/gsi/client";

function loadGoogleIdentityServices() {
  if (typeof window === "undefined") return Promise.reject(new Error("BROWSER_REQUIRED"));
  if (window.google?.accounts?.oauth2) return Promise.resolve(window.google);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="' + GIS_URL + '"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google), { once: true });
      existing.addEventListener("error", () => reject(new Error("GOOGLE_OAUTH_SCRIPT_FAILED")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = GIS_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => window.google?.accounts?.oauth2
      ? resolve(window.google)
      : reject(new Error("GOOGLE_OAUTH_UNAVAILABLE"));
    script.onerror = () => reject(new Error("GOOGLE_OAUTH_SCRIPT_FAILED"));
    document.head.appendChild(script);
  });
}

export async function requestGoogleDriveAccessToken(clientId) {
  if (!clientId || !clientId.trim()) throw new Error("GOOGLE_OAUTH_CLIENT_ID_MISSING");
  const google = await loadGoogleIdentityServices();
  return new Promise((resolve, reject) => {
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: GOOGLE_DRIVE_SCOPE,
      callback: response => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error || "GOOGLE_OAUTH_TOKEN_FAILED"));
          return;
        }
        resolve({
          accessToken: response.access_token,
          expiresAt: Date.now() + Math.max(0, Number(response.expires_in || 0)) * 1000,
        });
      },
      error_callback: error => reject(new Error(error?.type || "GOOGLE_OAUTH_POPUP_FAILED")),
    });
    tokenClient.requestAccessToken({ prompt: "consent" });
  });
}
