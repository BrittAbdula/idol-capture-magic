import { memberSilhouetteOverrides } from "./memberSilhouetteCatalog";

export { memberSilhouetteOverrides };

const defaultMemberSilhouette = "/placeholders/silhouette_1.png";

export function getMemberSilhouetteImage(
  groupSlug: string | null | undefined,
  memberSlug: string | null | undefined,
  fallback: string | null | undefined
): string {
  const groupKey = groupSlug?.toLowerCase();
  const memberKey = memberSlug?.toLowerCase();
  const override =
    groupKey && memberKey ? memberSilhouetteOverrides[groupKey]?.[memberKey] : undefined;

  return override ?? fallback ?? defaultMemberSilhouette;
}
