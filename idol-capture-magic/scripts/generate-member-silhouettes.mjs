import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(appRoot, "..");
const membersSeedPath = path.join(repoRoot, "server/src/db/seed/members.json");
const publicRoot = path.join(appRoot, "public");
const catalogPath = path.join(appRoot, "src/data/memberSilhouetteCatalog.ts");

const groupPalettes = {
  newjeans: ["#dff2f7", "#fff4d5", "#16202b", "#89c7d9"],
  ive: ["#f7e6ff", "#fff6df", "#241a31", "#d8a5ec"],
  aespa: ["#e8f0ff", "#f1e4ff", "#171627", "#8fb5ff"],
  "le-sserafim": ["#fff0ef", "#f7f2df", "#241b20", "#f0aaa5"],
  twice: ["#ffe8f1", "#e9f7ff", "#2a1d2a", "#f5a8c8"],
  blackpink: ["#ffdce9", "#f7f1f4", "#1b171b", "#ff91bd"],
  bts: ["#e7def7", "#f5f0ff", "#191724", "#b79cea"],
  "stray-kids": ["#ffe7df", "#f2f4ff", "#201819", "#ef9a7c"],
  seventeen: ["#edf2ff", "#fff1f6", "#1d2230", "#9db4f2"],
  enhypen: ["#e5eeff", "#f8f4e8", "#161b25", "#8da4d6"],
  txt: ["#e6f8e8", "#eef1ff", "#18221d", "#97d6a7"],
  itzy: ["#fff0d8", "#f2e9ff", "#221727", "#f0b36b"]
};

const hairTypes = [
  "shortSweep",
  "centerPart",
  "bob",
  "longStraight",
  "layeredWave",
  "curlyHalo",
  "softCrop",
  "ponytail",
  "highTail",
  "mullet",
  "sideBang",
  "halfUp"
];
const poses = ["front", "threeQuarter", "sideLeft", "sideRight"];
const accessories = ["none", "earring", "ribbon", "collar", "mic", "spark", "pin", "hoop"];
const rasterAssetGroups = new Set(Object.keys(groupPalettes));
const preservedCustomAssets = new Set([
  "bts/rm",
  "bts/jin",
  "bts/suga",
  "bts/j-hope",
  "bts/jimin",
  "bts/v",
  "bts/jung-kook"
]);

function hash(value) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function escapeXml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function pathForMember(groupSlug, memberSlug) {
  if (rasterAssetGroups.has(groupSlug)) {
    return `/placeholders/members/${groupSlug}/${memberSlug}.webp`;
  }

  return `/placeholders/members/${groupSlug}/${memberSlug}.svg`;
}

function silhouetteTraits(groupIndex, memberIndex, groupSlug, memberSlug) {
  const keyHash = hash(`${groupSlug}/${memberSlug}`);
  return {
    hair: hairTypes[(groupIndex * 5 + memberIndex * 3 + keyHash) % hairTypes.length],
    pose: poses[(groupIndex + memberIndex + keyHash) % poses.length],
    accessory: accessories[(groupIndex * 7 + memberIndex + keyHash) % accessories.length],
    tilt: ((keyHash % 7) - 3) * 1.8,
    shoulderShift: ((keyHash >> 5) % 34) - 17,
    haloScale: 0.94 + ((keyHash >> 9) % 10) / 100,
    highlightOpacity: 0.15 + ((keyHash >> 13) % 8) / 100
  };
}

function bodyPath(pose, shift) {
  if (pose === "sideLeft") {
    return `M${312 + shift} 1024c22-176 68-291 139-345 31-23 68-34 111-32 80 4 141 45 183 122 34 63 56 149 65 255H${312 + shift}Z`;
  }
  if (pose === "sideRight") {
    return `M${232 + shift} 1024c13-166 57-283 132-351 34-31 77-45 130-42 87 5 154 49 200 132 35 64 58 151 70 261H${232 + shift}Z`;
  }
  if (pose === "threeQuarter") {
    return `M${246 + shift} 1024c24-172 81-287 169-346 35-24 76-36 121-36 93 0 164 48 213 143 32 63 53 143 63 239H${246 + shift}Z`;
  }
  return `M${246 + shift} 1024c25-171 86-284 182-337 31-18 67-27 108-27 96 0 169 46 219 138 35 65 58 141 69 226H${246 + shift}Z`;
}

function headPath(pose) {
  if (pose === "sideLeft") {
    return "M503 278c74-3 131 40 154 112 20 65 10 130-30 195-31 50-75 79-130 86-59 7-106-12-140-57-25-33-34-74-27-123-31-8-51-23-58-45-7-23 5-42 35-57 14-67 80-108 196-111Z";
  }
  if (pose === "sideRight") {
    return "M536 278c-75-3-132 40-155 112-20 65-10 130 30 195 31 50 75 79 130 86 59 7 106-12 140-57 25-33 34-74 27-123 31-8 51-23 58-45 7-23-5-42-35-57-14-67-80-108-195-111Z";
  }
  if (pose === "threeQuarter") {
    return "M521 260c88 0 151 57 169 151 15 77-2 148-51 212-33 43-78 64-136 64-57 0-103-22-137-66-46-60-58-133-36-220 24-94 88-141 191-141Z";
  }
  return "M512 252c92 0 158 60 178 158 17 83-2 157-55 223-33 41-75 61-126 61-54 0-98-22-132-66-48-63-61-138-37-226 26-100 83-150 172-150Z";
}

function hairPath(type, pose) {
  const flip = pose === "sideRight" ? -1 : 1;
  switch (type) {
    case "centerPart":
      return `<path d="M512 229c-76 27-130 86-162 178 67-8 121-39 162-92 42 53 97 84 166 92-19-96-74-156-166-178Z" fill="var(--hair)"/><path d="M512 235c-8 79 13 148 63 207" fill="none" stroke="var(--shade)" stroke-width="6" opacity=".36"/>`;
    case "bob":
      return `<path d="M363 407c14-103 73-163 177-178 85 11 139 68 162 172 10 74 2 145-24 214-53-2-99-21-139-57-43 38-92 58-148 59-33-66-42-136-28-210Z" fill="var(--hair)"/><path d="M385 439c45 23 96 20 153-9 45 35 93 51 143 48" fill="none" stroke="var(--shade)" stroke-width="5" opacity=".28"/>`;
    case "longStraight":
      return `<path d="M352 390c16-105 80-166 192-183 93 18 149 85 168 201 18 107 6 223-36 350H518c-61-71-107-164-139-278-13 96-2 188 33 278H312c-1-137 12-260 40-368Z" fill="var(--hair)"/><path d="M545 214c-14 120 16 223 90 310" fill="none" stroke="var(--shade)" stroke-width="5" opacity=".3"/>`;
    case "layeredWave":
      return `<path d="M356 398c11-88 59-145 144-171 78-18 147 2 207 60 30 29 47 69 52 119-72-5-138-32-199-82-42 48-110 73-204 74Z" fill="var(--hair)"/><path d="M360 407c-24 69-13 139 34 210" fill="none" stroke="var(--hair)" stroke-width="34" stroke-linecap="round"/><path d="M704 423c34 73 27 143-21 211" fill="none" stroke="var(--hair)" stroke-width="34" stroke-linecap="round"/>`;
    case "curlyHalo":
      return (
        Array.from({ length: 18 }, (_, index) => {
          const angle = (Math.PI * 2 * index) / 18;
          const x = 512 + Math.cos(angle) * 136;
          const y = 390 + Math.sin(angle) * 118;
          const r = 42 + ((index * 11) % 18);
          return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="var(--hair)"/>`;
        }).join("") +
        `<path d="M385 398c17-97 73-150 168-159 89 19 139 76 150 172-43-3-88-22-135-57-47 43-108 58-183 44Z" fill="var(--hair)"/>`
      );
    case "softCrop":
      return `<path d="M356 397c16-85 70-139 162-162 82 5 142 45 181 120-54 18-111 20-171 6-55 39-112 51-172 36Z" fill="var(--hair)"/><path d="M411 279c48 58 112 95 193 110" fill="none" stroke="var(--shade)" stroke-width="5" opacity=".32"/>`;
    case "ponytail":
      return `<path d="M363 385c22-94 80-146 173-156 86 12 142 61 169 147-65 0-121-21-169-63-50 44-108 68-173 72Z" fill="var(--hair)"/><path d="M692 470c72 24 106 77 103 159-3 51-24 84-64 99 7-72-15-125-66-158Z" fill="var(--hair)"/>`;
    case "highTail":
      return `<path d="M383 378c23-88 78-137 165-148 78 16 132 62 162 138-76 1-135-20-177-64-45 41-95 65-150 74Z" fill="var(--hair)"/><path d="M521 235c21-55 61-79 120-72-16 43-50 77-104 101Z" fill="var(--hair)"/><path d="M654 456c63 32 87 84 73 156" fill="none" stroke="var(--hair)" stroke-width="32" stroke-linecap="round"/>`;
    case "mullet":
      return `<path d="M346 393c25-102 88-155 190-158 84 12 139 58 164 137-66-1-122-22-169-63-56 44-118 72-185 84Z" fill="var(--hair)"/><path d="M378 480c-17 82-7 158 30 230" fill="none" stroke="var(--hair)" stroke-width="35" stroke-linecap="round"/><path d="M673 479c20 79 12 154-24 224" fill="none" stroke="var(--hair)" stroke-width="35" stroke-linecap="round"/>`;
    case "sideBang":
      return `<path d="M353 407c17-102 79-163 185-181 76 6 129 46 160 119-81-2-153 24-216 78-44 38-87 53-129 45 0-21 0-41 0-61Z" fill="var(--hair)"/><path d="M496 251c64 89 130 136 198 141" fill="none" stroke="var(--shade)" stroke-width="5" opacity=".3"/>`;
    case "halfUp":
      return `<path d="M374 393c18-94 73-147 164-160 87 12 144 61 171 147-57 0-112-20-164-59-47 44-104 68-171 72Z" fill="var(--hair)"/><path d="M465 249c38-39 83-48 136-27-20 34-57 55-112 62Z" fill="var(--hair)"/><path d="M382 482c-12 92 5 181 50 267" fill="none" stroke="var(--hair)" stroke-width="32" stroke-linecap="round"/><path d="M682 479c10 88-6 176-48 264" fill="none" stroke="var(--hair)" stroke-width="32" stroke-linecap="round"/>`;
    case "shortSweep":
    default:
      return `<path d="M352 402c15-95 75-153 180-174 84 6 144 48 181 125-56 23-121 29-195 18-55 36-110 47-166 31Z" fill="var(--hair)"/><path d="M402 284c43 60 107 97 192 111" fill="none" stroke="var(--shade)" stroke-width="5" opacity=".32"/>`;
  }
}

function accessoryMarkup(type, accent, pose) {
  if (type === "earring") {
    const x = pose === "sideRight" ? 360 : 666;
    return `<path d="M${x} 544c21 22 21 48 0 77" fill="none" stroke="${accent}" stroke-width="10" stroke-linecap="round" opacity=".85"/>`;
  }
  if (type === "ribbon") {
    return `<path d="M464 667l-44 30 49 13 42-33-47-10Zm94 0 44 30-49 13-42-33 47-10Z" fill="${accent}" opacity=".72"/>`;
  }
  if (type === "collar") {
    return `<path d="M409 698c75 41 151 41 228 0" fill="none" stroke="${accent}" stroke-width="16" stroke-linecap="round" opacity=".55"/>`;
  }
  if (type === "mic") {
    return `<path d="M692 620c36 20 61 52 74 96" fill="none" stroke="${accent}" stroke-width="15" stroke-linecap="round" opacity=".72"/><circle cx="684" cy="612" r="15" fill="${accent}" opacity=".82"/>`;
  }
  if (type === "spark") {
    return `<path d="M729 304l15 40 40 15-40 15-15 40-15-40-40-15 40-15 15-40Z" fill="${accent}" opacity=".7"/>`;
  }
  if (type === "pin") {
    return `<circle cx="405" cy="360" r="20" fill="${accent}" opacity=".78"/><path d="M392 359h26" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/>`;
  }
  if (type === "hoop") {
    return `<circle cx="${pose === "sideRight" ? 368 : 666}" cy="548" r="28" fill="none" stroke="${accent}" stroke-width="9" opacity=".78"/>`;
  }
  return "";
}

function signatureMarks(groupSlug, memberSlug, accent) {
  const keyHash = hash(`${groupSlug}:${memberSlug}:marks`);
  const marks = [];
  for (let index = 0; index < 5; index += 1) {
    const x = 258 + ((keyHash >> (index * 3)) % 520);
    const y = 242 + ((keyHash >> (index * 4 + 2)) % 420);
    const radius = 4 + ((keyHash >> (index * 5 + 3)) % 10);
    marks.push(`<circle cx="${x}" cy="${y}" r="${radius}" fill="${accent}" opacity=".14"/>`);
  }
  return marks.join("");
}

function createSvg({ group, member, groupIndex, memberIndex }) {
  const [bgStart, bgEnd, ink, accent] = groupPalettes[group.groupSlug] ?? [
    "#eef4ff",
    "#fff4ef",
    "#1b1d27",
    "#abb9f1"
  ];
  const traits = silhouetteTraits(groupIndex, memberIndex, group.groupSlug, member.slug);
  const gradientId = `bg-${group.groupSlug}-${member.slug}`.replaceAll(/[^a-z0-9-]/g, "");
  const shade = "#090b12";
  const title = `${member.name} original silhouette`;

  return `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title" style="--hair:${ink};--shade:${shade}">
  <title>${escapeXml(title)}</title>
  <defs>
    <linearGradient id="${gradientId}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bgStart}"/>
      <stop offset="1" stop-color="${bgEnd}"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#${gradientId})"/>
  <ellipse cx="512" cy="462" rx="${Math.round(250 * traits.haloScale)}" ry="${Math.round(284 * traits.haloScale)}" fill="#ffffff" opacity=".2"/>
  ${signatureMarks(group.groupSlug, member.slug, accent)}
  <g transform="rotate(${traits.tilt} 512 512)">
    <path d="${bodyPath(traits.pose, traits.shoulderShift)}" fill="${ink}"/>
    <path d="${headPath(traits.pose)}" fill="${ink}"/>
    ${hairPath(traits.hair, traits.pose)}
    <path d="M414 368c42 48 100 78 174 91" fill="none" stroke="#ffffff" stroke-width="4" opacity="${traits.highlightOpacity.toFixed(2)}"/>
    ${accessoryMarkup(traits.accessory, accent, traits.pose)}
  </g>
</svg>
`;
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function createCatalog(groups) {
  const lines = ["export const memberSilhouetteOverrides = {"];

  for (const group of groups) {
    lines.push(`  ${JSON.stringify(group.groupSlug)}: {`);
    for (const member of group.members) {
      lines.push(
        `    ${JSON.stringify(member.slug)}: ${JSON.stringify(pathForMember(group.groupSlug, member.slug))},`
      );
    }
    lines.push("  },");
  }
  lines.push("} as const;");
  lines.push("");

  return `${lines.join("\n")}`;
}

const groups = JSON.parse(await readFile(membersSeedPath, "utf8"));
for (const [groupIndex, group] of groups.entries()) {
  const groupDir = path.join(publicRoot, "placeholders/members", group.groupSlug);
  await mkdir(groupDir, { recursive: true });

  for (const [memberIndex, member] of group.members.entries()) {
    const memberAssetPath = pathForMember(group.groupSlug, member.slug);
    const outputPath = path.join(publicRoot, memberAssetPath);
    if (memberAssetPath.endsWith(".webp")) {
      if (await exists(outputPath)) {
        continue;
      }
      throw new Error(`Missing imagegen member asset: ${memberAssetPath}`);
    }
    if (
      preservedCustomAssets.has(`${group.groupSlug}/${member.slug}`) &&
      (await exists(outputPath))
    ) {
      continue;
    }
    await writeFile(outputPath, createSvg({ group, member, groupIndex, memberIndex }), "utf8");
  }
}

await writeFile(catalogPath, createCatalog(groups), "utf8");
