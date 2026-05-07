import { AppPageShell } from "@/components/app/AppPageShell";

export default function MyBinder() {
  return (
    <AppPageShell
      title="My Binder"
      description="Saved photocards and generations will be collected here."
      image="/illustrations/empty-binder.png"
    />
  );
}
