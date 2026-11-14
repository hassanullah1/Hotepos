export default function sitemap() {
  const routes = ["", "/about", "/contact", "/pricing", "/features", "/hotel"];

  return routes.map((route) => ({
    url: `https://melmah.app${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.8,
  }));
}
