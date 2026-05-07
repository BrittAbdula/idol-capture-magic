import { AppPageShell } from "@/components/app/AppPageShell";

export default function Pricing() {
  return (
    <AppPageShell title="Pricing" description="Free, Plus, and Pro generation plans.">
      <div className="grid gap-4 md:grid-cols-3">
        {["Free", "Plus", "Pro"].map((plan) => (
          <section key={plan} className="border border-black/10 p-5">
            <h2 className="text-2xl font-semibold">{plan}</h2>
            <p className="mt-3 text-sm text-gray-600">Plan controls wire to Stripe in the backend.</p>
          </section>
        ))}
      </div>
    </AppPageShell>
  );
}
