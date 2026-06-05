export type PaidPlan = "plus" | "pro";

export const PRICING_FEATURES = [
  ["Daily generations", "3", "30", "200"],
  ["Watermark", "Visible", "Small", "None"],
  ["Photocard double-side", true, true, true],
  ["HD download", false, true, true],
  ["Binder unlimited", true, true, true],
  ["Print PDF", false, false, true],
  ["Premium concepts", false, true, true],
  ["Fancall", false, false, true]
] as const;

export const PRICING_PLANS: Array<{
  name: "Free" | "Plus" | "Pro";
  monthlyPrice: string;
  annualPrice: string;
  description: string;
  plan: PaidPlan | null;
}> = [
  {
    name: "Free",
    monthlyPrice: "$0",
    annualPrice: "$0",
    description: "Try the core flow with visible watermark.",
    plan: null
  },
  {
    name: "Plus",
    monthlyPrice: "$4.99/mo",
    annualPrice: "$49.90/yr",
    description: "More daily generations and small watermark.",
    plan: "plus"
  },
  {
    name: "Pro",
    monthlyPrice: "$9.99/mo",
    annualPrice: "$99.90/yr",
    description: "High-volume creation, watermark-free output, and pro export tools.",
    plan: "pro"
  }
];
