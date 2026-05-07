import { useParams } from "react-router-dom";

import { AppPageShell } from "@/components/app/AppPageShell";

export default function PublicBinder() {
  const { handle } = useParams();

  return (
    <AppPageShell
      title={`${handle ?? "Fan"}'s Binder`}
      description="A public IdolBooth binder."
      image="/illustrations/empty-binder.png"
    />
  );
}
