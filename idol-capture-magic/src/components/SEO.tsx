import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string | null;
  type?: "website" | "article";
}

const baseUrl = "https://idolbooth.com";

function absoluteUrl(value: string | null | undefined): string {
  if (!value) {
    return `${baseUrl}/brand/logo.png`;
  }
  return value.startsWith("http") ? value : `${baseUrl}${value.startsWith("/") ? value : `/${value}`}`;
}

function upsertMeta(selector: string, attrName: "name" | "property", attrValue: string, content: string) {
  let tag = document.querySelector(selector);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attrName, attrValue);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

const SEO: React.FC<SEOProps> = ({ title, description, image, type = "website" }) => {
  const location = useLocation();
  const canonicalUrl = `${baseUrl}${location.pathname}`;
  const resolvedTitle = title ?? "IdolBooth | K-pop AI Photo Maker";
  const resolvedDescription =
    description ?? "Create fan-safe, watermarked K-pop AI selcas, photocards, and photo strips.";
  const resolvedImage = absoluteUrl(image);

  useEffect(() => {
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute("href", canonicalUrl);
    } else {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      canonical.setAttribute("href", canonicalUrl);
      document.head.appendChild(canonical);
    }

    document.title = resolvedTitle;
    upsertMeta('meta[name="description"]', "name", "description", resolvedDescription);
    upsertMeta('meta[property="og:title"]', "property", "og:title", resolvedTitle);
    upsertMeta('meta[property="og:description"]', "property", "og:description", resolvedDescription);
    upsertMeta('meta[property="og:type"]', "property", "og:type", type);
    upsertMeta('meta[property="og:url"]', "property", "og:url", canonicalUrl);
    upsertMeta('meta[property="og:image"]', "property", "og:image", resolvedImage);
    upsertMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", resolvedTitle);
    upsertMeta('meta[name="twitter:description"]', "name", "twitter:description", resolvedDescription);
    upsertMeta('meta[name="twitter:image"]', "name", "twitter:image", resolvedImage);
  }, [canonicalUrl, resolvedDescription, resolvedImage, resolvedTitle, type]);

  return null;
};

export default SEO;
