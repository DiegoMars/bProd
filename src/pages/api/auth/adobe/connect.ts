// Planning on this endpoint to only be hit from the /admin page (will be protected with supabase auth)

import type { APIRoute } from "astro";
// import { supabase } from "../../../lib/supabase";

const IMS_AUTH_URL = "https://ims-na1.adobelogin.com/ims/authorize";

export const GET: APIRoute = async ({ url, redirect }) => {
  const adminSecret = url.searchParams.get("secret");
  console.log(adminSecret);
  console.log(import.meta.env.ADOBE_CLIENT_SECRET);
  if (adminSecret !== import.meta.env.ADOBE_CLIENT_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const params = new URLSearchParams({
    client_id: import.meta.env.ADOBE_CLIENT_ID,
    redirect_uri: import.meta.env.ADOBE_REDIRECT_URI,
    response_type: "code",
    scope: import.meta.env.ADOBE_SCOPES,
    // state: "some-csrf-or-random", // optional but recommended, idk what this is
  });

  return redirect(`${IMS_AUTH_URL}?${params.toString()}`);
}
