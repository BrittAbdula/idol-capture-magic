import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, Languages } from "lucide-react";

import { api, type ApiMember } from "@/api/client";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import { LoadingSkeleton } from "@/components/app/LoadingSkeleton";
import { ImageFrame } from "@/components/media/ImageFrame";
import { getMemberSilhouetteImage } from "@/data/memberSilhouettes";
import { ratioFromImagePath, type ImageFrameRatio } from "@/lib/imageRatios";

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

const productCards: Array<{
  title: string;
  href: string;
  image: string;
  description: string;
  ratio: ImageFrameRatio;
}> = [
  {
    title: "Selca with idol",
    href: "/selca",
    image: "/samples/polaroid-selca.png",
    description: "Square companion-style selcas for profile drops.",
    ratio: "square"
  },
  {
    title: "AI Photocard",
    href: "/photocard",
    image: "/samples/holo-frame-photocard.png",
    description: "Collectible vertical cards with fan-safe concepts.",
    ratio: "portrait"
  },
  {
    title: "Photo with Idol Online",
    href: "/photo-with-idol",
    image: "/samples/han-river-walk-selca.png",
    description: "Upload a selfie and create a fan-safe photo with idol online.",
    ratio: "square"
  },
  {
    title: "4-cut Photo Strip",
    href: "/strip",
    image: "/samples/life4cuts-classic-strip.png",
    description: "Use the classic webcam strip builder and download.",
    ratio: "portrait"
  }
];

const searchIntentLinks = [
  {
    label: "K-pop photobooth online free",
    href: "/strip",
    description: "Open the web photo strip flow with no app download."
  },
  {
    label: "Photo with idol",
    href: "/photo-with-idol",
    description: "Create a fan-safe AI selca with an idol-inspired companion."
  },
  {
    label: "Photobooth web K-pop free",
    href: "/templates",
    description: "Browse K-pop photo booth templates and start from a preset."
  },
  {
    label: "Idol photobooth",
    href: "/selca",
    description: "Make a square selca or companion-style idol photo."
  }
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
    () =>
      [...(selectedGroup.data?.members ?? [])]
        .sort((a, b) => birthdayScore(a) - birthdayScore(b))
        .slice(0, 3),
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
            <a
              href="#bias-picker"
              className="idol-button-square mt-8 inline-flex items-center gap-2"
            >
              Pick your bias <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="relative min-h-[58vh] overflow-hidden rounded-md border border-black/10 bg-[#f7f3eb] shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
            {heroSamples.map((sample, index) => (
              <img
                key={sample}
                src={sample}
                alt=""
                aria-hidden="true"
                className={`absolute inset-0 h-full w-full scale-110 object-cover blur-2xl transition-opacity duration-700 ${
                  index === activeSample ? "opacity-25" : "opacity-0"
                }`}
              />
            ))}
            <div className="absolute inset-4 flex items-center justify-center">
              {heroSamples.map((sample, index) => (
                <img
                  key={`${sample}-contain`}
                  src={sample}
                  alt={index === activeSample ? "Example IdolBooth generated photo" : ""}
                  aria-hidden={index !== activeSample}
                  className={`absolute max-h-full max-w-full object-contain transition-all duration-700 ${
                    index === activeSample ? "scale-100 opacity-100" : "scale-[0.985] opacity-0"
                  }`}
                />
              ))}
            </div>
            <div className="absolute bottom-4 left-4 flex gap-2">
              {heroSamples.map((sample, index) => (
                <button
                  key={sample}
                  aria-label={`Show sample ${index + 1}`}
                  aria-current={activeSample === index}
                  onClick={() => setActiveSample(index)}
                  className="flex h-11 w-11 items-end justify-center pb-2"
                >
                  <span
                    className={`h-1.5 w-8 border border-white transition-colors ${
                      activeSample === index ? "bg-white" : "bg-white/30"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-black/10 px-4 py-16 md:px-8 lg:px-14">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {productCards.map(({ title, href, image, description, ratio }) => (
              <Link key={href} to={href} className="group block">
                <ImageFrame
                  src={image}
                  alt={`${title} sample`}
                  ratio={ratio}
                  tone="warm"
                  interactive
                />
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

        <section className="px-4 py-16 md:px-8 lg:px-14">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-idol-gold">
                Popular searches
              </p>
              <h2 className="mt-3 text-3xl font-semibold">
                K-pop photobooth online, built for fast fan edits
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {searchIntentLinks.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="group border border-black/10 p-5 transition hover:border-idol-gold/60"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-semibold">{item.label}</h3>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 transition group-hover:translate-x-1" />
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{item.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="bias-picker" className="px-4 py-16 md:px-8 lg:px-14">
          <h2 className="text-3xl font-semibold">Pick your bias</h2>
          {groups.isLoading && (
            <div className="mt-6">
              <LoadingSkeleton rows={2} />
            </div>
          )}
          <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
            {groups.data?.map((group) => (
              <button
                key={group.id}
                onClick={() => setSelectedGroupSlug(group.slug)}
                className={`min-h-11 shrink-0 border px-4 py-2 text-sm transition-colors ${
                  selectedGroupSlug === group.slug
                    ? "border-idol-gold text-idol-gold"
                    : "border-black/10"
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
                <ImageFrame
                  src={getMemberSilhouetteImage(
                    selectedGroupSlug,
                    member.slug,
                    member.silhouetteImage
                  )}
                  alt={`${member.name} silhouette`}
                  ratio="square"
                  tone="cool"
                  className="rounded-none border-0 shadow-none"
                  imgClassName="p-2"
                />
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
            {campaigns.isLoading && (
              <div className="md:col-span-3">
                <LoadingSkeleton rows={2} />
              </div>
            )}
            {campaigns.data?.map((campaign) => (
              <Link
                key={campaign.id}
                to={`/c/${campaign.slug}`}
                className="border border-black/10 p-5"
              >
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
              <Link key={sample} to="/selca" className="group relative block overflow-hidden">
                <ImageFrame
                  src={sample}
                  alt="Recent IdolBooth fan creation"
                  ratio={ratioFromImagePath(sample)}
                  interactive
                >
                  <span className="absolute inset-x-0 bottom-0 translate-y-full bg-black/75 p-3 text-sm font-semibold text-white transition group-hover:translate-y-0 group-focus-visible:translate-y-0">
                    Make yours
                  </span>
                </ImageFrame>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
