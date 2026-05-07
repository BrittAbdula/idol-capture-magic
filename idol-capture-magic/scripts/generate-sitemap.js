import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const seedDir = path.join(repoRoot, "server", "src", "db", "seed");
const publicDir = path.resolve(__dirname, "../public");
const siteUrl = "https://idolbooth.com";
const today = new Date().toISOString().split("T")[0];

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(seedDir, file), "utf8"));
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function url(pathname, priority, changefreq = "weekly") {
  return {
    loc: `${siteUrl}${pathname}`,
    priority,
    changefreq
  };
}

const groups = readJson("groups.json");
const memberGroups = readJson("members.json");
const concepts = readJson("concepts.json");
const campaigns = readJson("campaigns.json");

const urls = [
  url("/", "1.0"),
  url("/selca", "0.9"),
  url("/photocard", "0.9"),
  url("/strip", "0.8"),
  url("/calendar", "0.7"),
  url("/pricing", "0.7"),
  url("/templates", "0.5"),
  url("/privacy", "0.4", "yearly"),
  url("/terms", "0.4", "yearly"),
  url("/legal/safety", "0.5", "monthly"),
  url("/legal/takedown", "0.5", "monthly")
];

for (const group of groups) {
  urls.push(url(`/g/${group.slug}`, "0.7"));
}

for (const entry of memberGroups) {
  for (const member of entry.members) {
    urls.push(url(`/g/${entry.groupSlug}/${member.slug}`, "0.8"));
  }
}

for (const concept of concepts) {
  const formatPath = concept.format === "fancall" ? "photocard" : concept.format;
  urls.push(url(`/${formatPath}?concept=${encodeURIComponent(concept.slug)}`, "0.6"));
}

for (const campaign of campaigns) {
  urls.push(url(`/c/${campaign.slug}`, "0.7"));
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (item) => `  <url>
    <loc>${escapeXml(item.loc)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;

fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, "sitemap.xml"), sitemap);
console.log(`Sitemap generated with ${urls.length} URLs.`);
