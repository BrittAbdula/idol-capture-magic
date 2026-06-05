import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const seedDir = path.join(repoRoot, "server", "src", "db", "seed");
const publicDir = path.resolve(__dirname, "../public");
const siteUrl = "https://idolbooth.com";

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

function url(pathname) {
  return {
    loc: `${siteUrl}${pathname}`
  };
}

const groups = readJson("groups.json");
const memberGroups = readJson("members.json");
const campaigns = readJson("campaigns.json");

const urls = [
  url("/"),
  url("/photo-with-idol"),
  url("/selca"),
  url("/photocard"),
  url("/strip"),
  url("/calendar"),
  url("/pricing"),
  url("/templates"),
  url("/privacy"),
  url("/terms"),
  url("/legal/safety"),
  url("/legal/takedown")
];

for (const group of groups) {
  urls.push(url(`/g/${group.slug}`));
}

for (const entry of memberGroups) {
  for (const member of entry.members) {
    urls.push(url(`/g/${entry.groupSlug}/${member.slug}`));
  }
}

for (const campaign of campaigns) {
  urls.push(url(`/c/${campaign.slug}`));
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (item) => `  <url>
    <loc>${escapeXml(item.loc)}</loc>
  </url>`
  )
  .join("\n")}
</urlset>
`;

fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, "sitemap.xml"), sitemap);
console.log(`Sitemap generated with ${urls.length} URLs.`);
