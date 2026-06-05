type AnalyticsValue = string | number | boolean | null | undefined;
type AnalyticsParams = Record<string, AnalyticsValue>;

declare global {
  interface Window {
    gtag?: (
      command: "event" | "config",
      eventName: string,
      params?: Record<string, string | number | boolean | null>
    ) => void;
  }
}

const LANDING_VIEW_SESSION_KEY = "idolbooth_landing_view_tracked";
const SAFE_QUERY_PARAMS = [
  "billing",
  "template",
  "memberId",
  "conceptId",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term"
] as const;
const UTM_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

let landingViewTrackedInMemory = false;

function cleanParams(params: AnalyticsParams): Record<string, string | number | boolean | null> {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined)
  ) as Record<string, string | number | boolean | null>;
}

export function trackEvent(eventName: string, params: AnalyticsParams = {}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", eventName, cleanParams(params));
}

export function routeTypeForPath(pathname: string): string {
  if (pathname === "/") return "home";
  if (pathname === "/photo-with-idol") return "search_intent";
  if (
    pathname === "/selca" ||
    pathname === "/photocard" ||
    pathname === "/strip" ||
    pathname === "/photo-strip" ||
    pathname === "/photo-booth"
  ) {
    return "generator";
  }
  if (pathname.startsWith("/templates") || pathname.startsWith("/template")) return "templates";
  if (pathname.startsWith("/g/") || pathname.startsWith("/c/")) return "content";
  if (pathname === "/pricing") return "pricing";
  if (pathname.startsWith("/me") || pathname.startsWith("/binder")) return "account";
  if (pathname.startsWith("/share")) return "share";
  if (pathname.startsWith("/legal") || pathname === "/privacy" || pathname === "/terms") {
    return "legal";
  }
  if (pathname === "/admin") return "admin";
  return "other";
}

export function safeSearchForAnalytics(search: string): string {
  const params = new URLSearchParams(search);
  const safeParams = new URLSearchParams();

  SAFE_QUERY_PARAMS.forEach((key) => {
    params.getAll(key).forEach((value) => {
      if (value) {
        safeParams.append(key, value.slice(0, 120));
      }
    });
  });

  const safeSearch = safeParams.toString();
  return safeSearch ? `?${safeSearch}` : "";
}

export function pagePathForAnalytics(pathname: string, search: string): string {
  return `${pathname}${safeSearchForAnalytics(search)}`;
}

export function utmParamsFromSearch(search: string): AnalyticsParams {
  const params = new URLSearchParams(search);
  return Object.fromEntries(UTM_PARAMS.map((key) => [key, params.get(key)]));
}

export function referrerDomainFromUrl(referrer: string): string | null {
  if (!referrer) return null;

  try {
    const host = new URL(referrer).hostname;
    return host.replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

function hasTrackedLandingView(): boolean {
  if (landingViewTrackedInMemory) return true;

  try {
    return window.sessionStorage.getItem(LANDING_VIEW_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function markLandingViewTracked() {
  landingViewTrackedInMemory = true;

  try {
    window.sessionStorage.setItem(LANDING_VIEW_SESSION_KEY, "1");
  } catch {
    // Analytics must not affect the app if storage is unavailable.
  }
}

export function trackPageView(pathname: string, search: string, title: string) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  const pagePath = pagePathForAnalytics(pathname, search);
  const routeType = routeTypeForPath(pathname);
  window.gtag("event", "page_view", {
    page_title: title,
    page_location: `${window.location.origin}${pagePath}`,
    page_path: pagePath,
    route_type: routeType
  });
}

export function trackLandingView(pathname: string, search: string) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  const routeType = routeTypeForPath(pathname);
  if (hasTrackedLandingView()) {
    return;
  }

  markLandingViewTracked();
  trackEvent("landing_view", {
    landing_path: pathname,
    landing_route_type: routeType,
    referrer_domain: referrerDomainFromUrl(document.referrer),
    ...utmParamsFromSearch(search)
  });
}
