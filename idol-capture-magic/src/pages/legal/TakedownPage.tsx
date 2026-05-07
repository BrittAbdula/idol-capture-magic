import { Mail } from "lucide-react";

import { AppPageShell } from "@/components/app/AppPageShell";

export default function TakedownPage() {
  return (
    <AppPageShell
      title="Takedown"
      description="Request review or removal of generated content."
    >
      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="prose max-w-3xl">
          <h2>Request content review</h2>
          <p>
            Send the public share URL, a short explanation, and proof that you are authorized to
            request removal. IdolBooth will review reported generated images and remove violating
            public links.
          </p>
          <h2>What to include</h2>
          <p>
            Include the share link, your contact email, the rights or safety concern, and whether
            the issue involves identity, licensing, harassment, or explicit content.
          </p>
        </div>
        <aside className="border border-black/10 p-5">
          <Mail className="h-5 w-5 text-idol-gold" />
          <h2 className="mt-3 text-2xl font-semibold">Contact</h2>
          <p className="mt-2 text-sm text-gray-600">Use the launch support mailbox configured by the operator.</p>
          <a href="mailto:takedown@idolbooth.com" className="idol-button-square mt-5 inline-flex">
            Email takedown
          </a>
        </aside>
      </div>
    </AppPageShell>
  );
}
