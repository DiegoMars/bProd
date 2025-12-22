import type { APIRoute } from "astro";
import { getAccessToken } from "@/lib/adobeAuth";

const base = "https://lr.adobe.io/v2";
const key = import.meta.env.ADOBE_CLIENT_ID;

function parseJson(text: string) {
  const cleaned = text.replace(/^while\s*\(\s*1\s*\)\s*\{\s*\}\s*/, "");
  return JSON.parse(cleaned);
}

export async function getPhotos() {
  try {
    const accessToken = await getAccessToken();

    // 1) Get the user's (single) catalog metadata
    const catalogResp = await fetch(`${base}/catalog`, {
      headers: {
        "X-API-Key": key,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const catalogText = await catalogResp.text();
    if (!catalogResp.ok) {
      return new Response(`Catalog fetch failed: ${catalogText}`, { status: 500 });
    }

    const catalogJson = parseJson(catalogText);
    const catalogId = catalogJson?.id;
    if (!catalogId) {
      return new Response(`No catalog id found: ${JSON.stringify(catalogJson)}`, {
        status: 500,
      });
    }

    // 2) Fetch assets from that catalog
    const assetsResp = await fetch(`${base}/catalogs/${catalogId}/assets?limit=50`, {
      headers: {
        "X-API-Key": key,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const assetsText = await assetsResp.text();
    if (!assetsResp.ok) {
      return new Response(`Assets fetch failed: ${assetsText}`, { status: 500 });
    }

    const assetsJson = parseJson(assetsText);
    const items = assetsJson?.resources ?? [];

    const photos = items.map((asset: any) => ({
      id: asset.id,
      created: asset.created,
      updated: asset.updated,
      renditions: asset.links ?? {},
      metadata: asset.payload ?? {},
    }));

    return new Response(JSON.stringify({ catalogId, photos }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error(err);
    return new Response(`Error: ${err?.message ?? "unknown error"}`, {
      status: 500,
    });
  }
};
