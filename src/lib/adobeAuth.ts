import { supabase } from "./supabase";
const IMS_TOKEN_URL = "https://ims-na1.adobelogin.com/ims/token";

type StoredTokens = {
  access_token: string;
  refresh_token?: string;
  expires_at: number; // unix ms timestamp
};

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
  saveTokens(inMemoryTokens);
}

async function loadTokens(): Promise<StoredTokens | null> {
  // TODO: load from your DB / secrets store
  const { data, error } = await supabase
    .from("lightroom_tokens")
    .select()
    .single();
  if (error) {
    throw new Error("Failed to load from Supabase");
  }
  inMemoryTokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    // refresh a minute before actual expiry
    expires_at: new Date(data.expires_at).getTime(),
  };
  return inMemoryTokens;
}

async function saveTokens(tokens: StoredTokens) {
  const { error } = await supabase
    .from("lightroom_tokens")
    .upsert(
      {
        label: "default",
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(tokens.expires_at).toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "label" }
    );
  if (error) {
    console.error('Error saving tokens to Supabase', error);
  }
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
