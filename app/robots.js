export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/dashboard/", "/api/"],
      },
    ],

    sitemap: "https://melmah.app/sitemap.xml",
    host: "https://melmah.app",
  };
}
