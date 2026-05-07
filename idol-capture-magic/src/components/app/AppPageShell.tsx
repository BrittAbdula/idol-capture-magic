import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import type React from "react";

interface AppPageShellProps {
  title: string;
  description: string;
  image?: string;
  children?: React.ReactNode;
}

export function AppPageShell({ title, description, image, children }: AppPageShellProps) {
  return (
    <div className="min-h-screen bg-white text-gray-950">
      <SEO title={`${title} | IdolBooth`} description={description} image={image} />
      <Navbar />
      <main className="pt-28">
        <section className="relative overflow-hidden border-b border-black/10">
          {image && (
            <img
              src={image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-25"
            />
          )}
          <div className="relative mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
            <h1 className="max-w-3xl text-4xl font-bold tracking-normal md:text-6xl">
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-gray-600">{description}</p>
          </div>
        </section>
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
