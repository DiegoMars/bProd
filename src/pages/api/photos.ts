import { base, key, getCatalogID, getAccessToken, parseJson } from "@/lib/adobeAuth";

export async function getAlbums() {
  try {
    const accessToken = await getAccessToken();
    const catalogIdResp = await getCatalogID(accessToken);

    if (!catalogIdResp.ok) {
      return {
        ok: false as const,
        status: catalogIdResp.status || 500,
        message: `Catalog Id Error: ${catalogIdResp.message}`
      };
    }
    const catalogId = catalogIdResp.catalogId;
    console.log("catalogId: " + JSON.stringify(catalogId, null, 2))

    const albumsReqURL = `${base}/catalogs/${catalogId}/albums`;
    console.log(albumsReqURL);
    const albumsResp = await fetch(albumsReqURL, {
      headers: { "X-API-Key": key, Authorization: `Bearer ${accessToken}` },
    });

    const assetsJson = parseJson(await albumsResp.text());
    if (!albumsResp.ok) {
      return {
        ok: false as const,
        status: albumsResp.status || 500,
        message: `Assets fetch failed: ${JSON.stringify(assetsJson, null, 2)}`
      };
    }

    const items = assetsJson?.resources ?? [];

    const photos = items.map((asset: any) => ({
      id: asset.id,
      created: asset.created,
      updated: asset.updated,
      renditions: asset.links ?? {},
      metadata: asset.payload ?? {},
    }));

    return {
      ok: true as const,
      status: 200 as const,
      catalogId,
      photos
    };
  } catch (err: any) {
    console.error(err);
    return {
      ok: false as const,
      status: 500,
      message: `Error: ${err?.message ?? "unknown error"}`
    };
  }
}
