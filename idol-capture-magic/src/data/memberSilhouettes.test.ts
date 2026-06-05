import { describe, expect, test } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { getMemberSilhouetteImage, memberSilhouetteOverrides } from "./memberSilhouettes";

interface MemberSeedGroup {
  groupSlug: string;
  members: Array<{
    slug: string;
    name: string;
  }>;
}

const memberSeedGroups = JSON.parse(
  readFileSync(path.join(process.cwd(), "../server/src/db/seed/members.json"), "utf8")
) as MemberSeedGroup[];

describe("getMemberSilhouetteImage", () => {
  test("uses member-specific BTS silhouette assets", () => {
    expect(getMemberSilhouetteImage("bts", "rm", "/placeholders/silhouette_1.png")).toBe(
      "/placeholders/members/bts/rm.webp"
    );
    expect(getMemberSilhouetteImage("bts", "jung-kook", "/placeholders/silhouette_1.png")).toBe(
      "/placeholders/members/bts/jung-kook.webp"
    );
  });

  test("keeps API fallback images for members without an override", () => {
    expect(
      getMemberSilhouetteImage("unknown-group", "unknown-member", "/placeholders/silhouette_3.png")
    ).toBe("/placeholders/silhouette_3.png");
  });

  test("uses unique member-specific bundled assets for every seeded member", () => {
    const resolvedPaths = memberSeedGroups.flatMap((group) =>
      group.members.map((member) => {
        const expectedPath =
          memberSilhouetteOverrides[group.groupSlug]?.[member.slug] ??
          `/placeholders/members/${group.groupSlug}/${member.slug}.svg`;
        const resolvedPath = getMemberSilhouetteImage(
          group.groupSlug,
          member.slug,
          "/placeholders/silhouette_1.png"
        );

        expect(resolvedPath, `${group.groupSlug}/${member.slug}`).toBe(expectedPath);
        expect(existsSync(path.join(process.cwd(), "public", resolvedPath)), resolvedPath).toBe(
          true
        );

        return resolvedPath;
      })
    );

    expect(new Set(resolvedPaths).size).toBe(resolvedPaths.length);
  });

  test("points every override at a bundled public asset", () => {
    const paths = Object.values(memberSilhouetteOverrides).flatMap((group) => Object.values(group));

    expect(paths.length).toBeGreaterThan(0);
    for (const assetPath of paths) {
      expect(existsSync(path.join(process.cwd(), "public", assetPath))).toBe(true);
    }
  });
});
