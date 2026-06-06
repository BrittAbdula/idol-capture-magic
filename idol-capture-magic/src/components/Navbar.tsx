import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { AuthStatus } from "@/components/app/AuthStatus";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "py-3 glass-panel-square bg-opacity-90" : "py-5 bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          <Link to="/" className="group flex min-h-11 items-center gap-2" aria-label="IdolBooth Home">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <div className="absolute inset-0 border-2 border-idol-gold opacity-80 group-hover:opacity-100 transition-opacity"></div>
              {/* <Camera className="w-6 h-6 text-idol-gold group-hover:scale-110 transition-transform" /> */}
              <img src="/logo.png" alt="IdolBooth Logo" className="w-10 h-10" />
              <div className="absolute top-0 left-0 w-full h-full bg-idol-gold/20 opacity-0 group-hover:opacity-100 animate-pulse-slight transition-opacity"></div>
            </div>
            <span className="text-xl font-montserrat font-semibold tracking-tight">
              IdolBooth<span className="text-idol-gold">.com</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-3">
            <Link
              to="/"
              className={`inline-flex min-h-11 items-center px-2 font-montserrat text-sm transition-colors hover:text-idol-gold ${location.pathname === "/" ? "text-idol-gold" : ""}`}
            >
              Home
            </Link>
            <Link
              to="/selca"
              className={`inline-flex min-h-11 items-center px-2 font-montserrat text-sm transition-colors hover:text-idol-gold ${location.pathname === "/selca" ? "text-idol-gold" : ""}`}
            >
              Selca
            </Link>
            <Link
              to="/photocard"
              className={`inline-flex min-h-11 items-center px-2 font-montserrat text-sm transition-colors hover:text-idol-gold ${location.pathname === "/photocard" ? "text-idol-gold" : ""}`}
            >
              Photocard
            </Link>
            <Link
              to="/templates"
              className={`inline-flex min-h-11 items-center px-2 font-montserrat text-sm transition-colors hover:text-idol-gold ${location.pathname.includes("/template") && !location.pathname.includes("/template-creator") ? "text-idol-gold" : ""}`}
            >
              Templates
            </Link>
            <Link
              to="/strip"
              className={`inline-flex min-h-11 items-center px-2 font-montserrat text-sm transition-colors hover:text-idol-gold ${location.pathname === "/strip" ? "text-idol-gold" : ""}`}
            >
              Strip
            </Link>
            <AuthStatus />
          </nav>

          <button
            className="inline-flex h-11 w-11 items-center justify-center md:hidden"
            onClick={toggleMobileMenu}
            aria-label="Toggle Menu"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div
          id="mobile-navigation"
          className="fixed inset-0 z-[100] min-h-screen min-h-[100dvh] overflow-y-auto bg-zinc-950 text-white transition-opacity duration-300 md:hidden"
        >
          <div className="flex justify-end p-4 pt-[max(1rem,env(safe-area-inset-top))]">
            <button
              className="inline-flex h-11 w-11 items-center justify-center"
              onClick={toggleMobileMenu}
              aria-label="Close Menu"
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <nav className="flex min-h-[calc(100vh-5rem)] min-h-[calc(100dvh-5rem)] flex-col items-center justify-center gap-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Link
              to="/"
              className={`inline-flex min-h-12 items-center px-4 font-montserrat text-2xl transition-colors hover:text-idol-gold ${location.pathname === "/" ? "text-idol-gold" : "text-white"}`}
            >
              Home
            </Link>
            <Link
              to="/selca"
              className={`inline-flex min-h-12 items-center px-4 font-montserrat text-2xl transition-colors hover:text-idol-gold ${location.pathname === "/selca" ? "text-idol-gold" : "text-white"}`}
            >
              Selca
            </Link>
            <Link
              to="/photocard"
              className={`inline-flex min-h-12 items-center px-4 font-montserrat text-2xl transition-colors hover:text-idol-gold ${location.pathname === "/photocard" ? "text-idol-gold" : "text-white"}`}
            >
              Photocard
            </Link>
            <Link
              to="/templates"
              className={`inline-flex min-h-12 items-center px-4 font-montserrat text-2xl transition-colors hover:text-idol-gold ${location.pathname.includes("/template") && !location.pathname.includes("/template-creator") ? "text-idol-gold" : "text-white"}`}
            >
              Templates
            </Link>
            <Link
              to="/pricing"
              className={`inline-flex min-h-12 items-center px-4 font-montserrat text-2xl transition-colors hover:text-idol-gold ${location.pathname === "/pricing" ? "text-idol-gold" : "text-white"}`}
            >
              Pricing
            </Link>
            <Link
              to="/strip"
              className={`inline-flex min-h-12 items-center px-4 font-montserrat text-2xl transition-colors hover:text-idol-gold ${location.pathname === "/strip" ? "text-idol-gold" : "text-white"}`}
            >
              Strip
            </Link>
            <AuthStatus />
          </nav>
        </div>
      )}
    </>
  );
};

export default Navbar;
