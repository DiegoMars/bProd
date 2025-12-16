import type { APIRoute as APIRouteCallback } from "astro";
import { setStoredTokens } from "../../../../lib/adobeAuth";

const IMS_TOKEN_URL_CALLBACK = "https://ims-na1.adobelogin.com/ims/token";

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
};

export const GET: APIRouteCallback = async ({ url }) => {
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return new Response(`Adobe error: ${error}`, { status: 400 });
  }

  if (!code) {
    return new Response("Missing code", { status: 400 });
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: import.meta.env.ADOBE_CLIENT_ID,
    client_secret: import.meta.env.ADOBE_CLIENT_SECRET,
    redirect_uri: import.meta.env.ADOBE_REDIRECT_URI,
  });

  const resp = await fetch(IMS_TOKEN_URL_CALLBACK, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!resp.ok) {
    const text = await resp.text();
    return new Response(`Token exchange failed: ${text}`, { status: 500 });
  }

  const tokens = (await resp.json()) as TokenResponse;

  // Store in memory (for now) and also persist via your own logic.
  setStoredTokens(tokens);

  return new Response(
    "Lightroom has been connected successfully. You can close this tab.",
    {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    }
  );
};
