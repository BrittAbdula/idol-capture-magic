import { describe, expect, test } from "vitest";

import {
  pagePathForAnalytics,
  referrerDomainFromUrl,
  routeTypeForPath,
  safeSearchForAnalytics,
  utmParamsFromSearch
} from "@/lib/analytics";

describe("routeTypeForPath", () => {
  test("classifies search, generator, template, and account routes", () => {
    expect(routeTypeForPath("/")).toBe("home");
    expect(routeTypeForPath("/photo-with-idol")).toBe("search_intent");
    expect(routeTypeForPath("/strip")).toBe("generator");
    expect(routeTypeForPath("/photo-booth")).toBe("generator");
    expect(routeTypeForPath("/template/kpop")).toBe("templates");
    expect(routeTypeForPath("/templates/kpop")).toBe("templates");
    expect(routeTypeForPath("/me/binder")).toBe("account");
  });
});

describe("safeSearchForAnalytics", () => {
  test("keeps useful campaign and product params while dropping access keys", () => {
    const search = safeSearchForAnalytics(
      "?accessKey=secret&utm_source=google&utm_medium=organic&billing=success&memberId=jennie&empty="
    );
    const params = new URLSearchParams(search);

    expect(params.get("accessKey")).toBeNull();
    expect(params.get("empty")).toBeNull();
    expect(params.get("utm_source")).toBe("google");
    expect(params.get("utm_medium")).toBe("organic");
    expect(params.get("billing")).toBe("success");
    expect(params.get("memberId")).toBe("jennie");
  });

  test("uses the safe query string for page paths", () => {
    expect(pagePathForAnalytics("/share", "?accessKey=secret&utm_campaign=launch")).toBe(
      "/share?utm_campaign=launch"
    );
  });
});

describe("utmParamsFromSearch", () => {
  test("extracts all supported UTM params", () => {
    expect(utmParamsFromSearch("?utm_source=google&utm_term=photo%20with%20idol")).toEqual({
      utm_source: "google",
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
      utm_term: "photo with idol"
    });
  });
});

describe("referrerDomainFromUrl", () => {
  test("normalizes valid referrers to domains", () => {
    expect(referrerDomainFromUrl("https://www.google.com/search?q=idolbooth")).toBe("google.com");
  });

  test("returns null for empty or malformed referrers", () => {
    expect(referrerDomainFromUrl("")).toBeNull();
    expect(referrerDomainFromUrl("not a url")).toBeNull();
  });
});
