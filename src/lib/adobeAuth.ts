// THIS WILL BE ACCESSED BY FRONT END
// Here will attempt to access supabase for tokens
// If expired locally or nonexistant, pull from supabase
// If supabase ones expired, update them with adobe, save them locally and on supabase
// If still no work, return "under maintenance" or code 503 (for service unavailable)

const IMS_TOKEN_URL = "https://ims-na1.adobelogin.com/ims/token";

type StoredTokens = {
  access_token: string;
  refresh_token?: string;
  expires_at: number; // unix ms timestamp
};

// TODO: Replace this with a real DB / KV store + encryption at rest.
let inMemoryTokens: StoredTokens | null = null;

export function setStoredTokens(tokens: {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}) {
  inMemoryTokens = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    // refresh a minute before actual expiry
    expires_at: Date.now() + tokens.expires_in * 1000 - 60_000,
  };
}

async function loadTokens(): Promise<StoredTokens | null> {
  // TODO: load from your DB / secrets store
  return inMemoryTokens;
}

async function saveTokens(tokens: StoredTokens) {
  // TODO: persist to your DB / secrets store
  inMemoryTokens = tokens;
}

export async function getAccessToken(): Promise<string> {
  const tokens = await loadTokens();
  if (!tokens) {
    throw new Error("No Lightroom tokens stored; connect Adobe first.");
  }

  const now = Date.now();
  const stillValid = now < tokens.expires_at || !tokens.refresh_token;

  if (stillValid) {
    return tokens.access_token;
  }

  if (!tokens.refresh_token) {
    throw new Error("Refresh token missing; reconnect Adobe.");
  }

  // Refresh via IMS
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: tokens.refresh_token,
    client_id: import.meta.env.ADOBE_CLIENT_ID,
    client_secret: import.meta.env.ADOBE_CLIENT_SECRET,
  });

  const resp = await fetch(IMS_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Failed to refresh Adobe token: ${text}`);
  }

  const json = (await resp.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  const updated: StoredTokens = {
    access_token: json.access_token,
    refresh_token: json.refresh_token ?? tokens.refresh_token,
    expires_at: Date.now() + json.expires_in * 1000 - 60_000,
  };

  await saveTokens(updated);
  return updated.access_token;
}
