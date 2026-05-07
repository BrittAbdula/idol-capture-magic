import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, Languages } from "lucide-react";

import { api, type ApiMember } from "@/api/client";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";

const heroSamples = [
  "/samples/polaroid-selca.png",
  "/samples/holo-frame-photocard.png",
  "/samples/life4cuts-classic-strip.png"
];

const recentSamples = [
  "/samples/cafe-window-selca.png",
  "/samples/cherry-blossom-selca.png",
  "/samples/fanmeet-ticket-photocard.png",
  "/samples/glitter-pc-photocard.png",
  "/samples/pastel-frame-strip.png",
  "/samples/neon-sign-strip.png",
  "/samples/season-greeting-photocard.png",
  "/samples/han-river-walk-selca.png",
  "/samples/retro-photobooth-strip.png",
  "/samples/plain-pc-photocard.png",
  "/samples/monochrome-strip.png",
  "/samples/neon-night-selca.png"
];

function birthdayScore(member: ApiMember): number {
  if (!member.birthday) {
    return Number.POSITIVE_INFINITY;
  }
  const [month, day] = member.birthday.split("-").map(Number);
  const today = new Date();
  const next = new Date(today.getFullYear(), month - 1, day);
  if (next < today) {
    next.setFullYear(today.getFullYear() + 1);
  }
  return Math.ceil((next.getTime() - today.getTime()) / 86_400_000);
}

export default function Index() {
  const [selectedGroupSlug, setSelectedGroupSlug] = useState("newjeans");
  const [activeSample, setActiveSample] = useState(0);
  const groups = useQuery({ queryKey: ["groups"], queryFn: api.groups });
  const selectedGroup = useQuery({
    queryKey: ["group", selectedGroupSlug],
    queryFn: () => api.group(selectedGroupSlug),
    enabled: Boolean(selectedGroupSlug)
  });
  const campaigns = useQuery({
    queryKey: ["campaigns", "week"],
    queryFn: () => api.campaigns({ status: "upcoming,active", limit: 6 })
  });
  const birthdays = useMemo(
    () => [...(selectedGroup.data?.members ?? [])].sort((a, b) => birthdayScore(a) - birthdayScore(b)).slice(0, 3),
    [selectedGroup.data?.members]
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSample((value) => (value + 1) % heroSamples.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-950">
      <SEO
        title="Free K-pop AI Selca, Photocard & Photobooth | IdolBooth"
        description="Make a selca with your bias in 30 seconds. No download. Free forever."
      />
      <Navbar />

      <main>
        <section className="grid min-h-[calc(100svh-72px)] items-center gap-10 px-4 pt-28 md:grid-cols-2 md:px-8 lg:px-14">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-idol-gold">
              IdolBooth
            </p>
            <h1 className="text-5xl font-bold tracking-normal md:text-7xl">
              Free K-pop AI Selca, Photocard & Photobooth
            </h1>
            <p className="mt-6 max-w-xl text-lg text-gray-600">
              Make a selca with your bias in 30 seconds. No download. Free forever.
            </p>
            <a href="#bias-picker" className="idol-button-square mt-8 inline-flex items-center gap-2">
              Pick your bias <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="relative min-h-[58vh] overflow-hidden border border-black/10 bg-gray-50">
            {heroSamples.map((sample, index) => (
              <img
                key={sample}
                src={sample}
                alt=""
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                  index === activeSample ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}
            <div className="absolute bottom-4 left-4 flex gap-2">
              {heroSamples.map((sample, index) => (
                <button
                  key={sample}
                  aria-label={`Show sample ${index + 1}`}
                  onClick={() => setActiveSample(index)}
                  className={`h-2 w-8 border border-white ${activeSample === index ? "bg-white" : "bg-white/30"}`}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-black/10 px-4 py-16 md:px-8 lg:px-14">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              ["Selca with idol", "/selca", "/samples/polaroid-selca.png", "Square companion-style selcas for profile drops."],
              ["AI Photocard", "/photocard", "/samples/holo-frame-photocard.png", "Collectible vertical cards with fan-safe concepts."],
              ["4-cut Photo Strip", "/strip", "/samples/life4cuts-classic-strip.png", "Use the classic webcam strip builder and download."]
            ].map(([title, href, image, description]) => (
              <Link key={href} to={href} className="group block">
                <img src={image} alt="" className="aspect-[4/5] w-full object-cover" />
                <div className="mt-4 flex items-start justify-between gap-4 border-t border-black/10 pt-4">
                  <div>
                    <h2 className="text-xl font-semibold">{title}</h2>
                    <p className="mt-1 text-sm text-gray-600">{description}</p>
                    <p className="mt-3 text-sm font-semibold text-idol-gold">Try free</p>
                  </div>
                  <ArrowRight className="mt-1 h-5 w-5 transition group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section id="bias-picker" className="px-4 py-16 md:px-8 lg:px-14">
          <h2 className="text-3xl font-semibold">Pick your bias</h2>
          <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
            {groups.data?.map((group) => (
              <button
                key={group.id}
                onClick={() => setSelectedGroupSlug(group.slug)}
                className={`shrink-0 border px-4 py-2 text-sm ${
                  selectedGroupSlug === group.slug ? "border-idol-gold text-idol-gold" : "border-black/10"
                }`}
              >
                {group.name}
              </button>
            ))}
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-6">
            {selectedGroup.data?.members.map((member) => (
              <Link
                key={member.id}
                to={`/g/${selectedGroupSlug}/${member.slug}`}
                className="group overflow-hidden border border-black/10"
              >
                <img src={member.silhouetteImage} alt="" className="aspect-square w-full object-cover" />
                <div className="p-3 text-sm font-semibold">{member.name}</div>
              </Link>
            ))}
          </div>
        </section>

        <section className="border-t border-black/10 px-4 py-16 md:px-8 lg:px-14">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-3xl font-semibold">This week in K-pop</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Languages className="h-4 w-4" />
              English
            </div>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {campaigns.data?.map((campaign) => (
              <Link key={campaign.id} to={`/c/${campaign.slug}`} className="border border-black/10 p-5">
                <p className="text-sm uppercase tracking-wide text-idol-gold">{campaign.status}</p>
                <h3 className="mt-2 text-xl font-semibold">{campaign.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{campaign.description}</p>
              </Link>
            ))}
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {birthdays.map((member) => (
              <div key={member.id} className="flex items-center gap-3 border border-black/10 p-4">
                <CalendarDays className="h-5 w-5 text-idol-gold" />
                <div>
                  <p className="font-semibold">{member.name} birthday</p>
                  <p className="text-sm text-gray-600">{birthdayScore(member)} days away</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-black/10 px-4 py-16 md:px-8 lg:px-14">
          <h2 className="text-3xl font-semibold">Recent fan creations</h2>
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-6">
            {recentSamples.map((sample) => (
              <Link key={sample} to="/selca" className="group relative overflow-hidden border border-black/10">
                <img src={sample} alt="" className="aspect-[4/5] w-full object-cover" />
                <span className="absolute inset-x-0 bottom-0 translate-y-full bg-black/75 p-3 text-sm font-semibold text-white transition group-hover:translate-y-0">
                  Make yours
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
