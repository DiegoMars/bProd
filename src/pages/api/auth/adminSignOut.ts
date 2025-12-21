import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete("sb-access-token", { path: "/admin" });
  cookies.delete("sb-refresh-token", { path: "/admin" });
  return redirect("/admin/signin");
};
