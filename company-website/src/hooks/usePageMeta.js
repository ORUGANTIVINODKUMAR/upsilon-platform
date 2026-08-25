import { useEffect } from "react";

const SITE_NAME = "Upsilon Services";
const SITE_URL = "https://www.upsilonservices.com";
const DEFAULT_OG_IMAGE = `${SITE_URL}/upsilonlogo.png`;

function setMetaTag(attribute, key, content) {
  if (!content) return;

  let element = document.head.querySelector(
    `meta[${attribute}="${key}"]`
  );

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

function setCanonicalUrl(url) {
  let canonical = document.head.querySelector('link[rel="canonical"]');

  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }

  canonical.setAttribute("href", url);
}

function normalizePath(path) {
  if (!path || path === "/") {
    return "/";
  }

  return `/${path.replace(/^\/+|\/+$/g, "")}`;
}

function buildFullTitle(title) {
  if (!title) {
    return SITE_NAME;
  }

  const normalizedTitle = title.trim();

  // Avoid creating:
  // "Page Title | Upsilon Services | Upsilon Services"
  if (normalizedTitle.toLowerCase().includes(SITE_NAME.toLowerCase())) {
    return normalizedTitle;
  }

  return `${normalizedTitle} | ${SITE_NAME}`;
}

export default function usePageMeta({
  title,
  description,
  path = "/",
  image = DEFAULT_OG_IMAGE,
  imageAlt,
  type = "website",
  noIndex = false,
}) {
  useEffect(() => {
    const normalizedPath = normalizePath(path);

    const pageUrl =
      normalizedPath === "/"
        ? `${SITE_URL}/`
        : `${SITE_URL}${normalizedPath}`;

    const fullTitle = buildFullTitle(title);

    const selectedImage = image || DEFAULT_OG_IMAGE;

    const fullImage = selectedImage.startsWith("http")
      ? selectedImage
      : `${SITE_URL}${
          selectedImage.startsWith("/")
            ? selectedImage
            : `/${selectedImage}`
        }`;

    const finalImageAlt =
      imageAlt || `${SITE_NAME} accounting outsourcing services`;

    document.title = fullTitle;

    setMetaTag("name", "description", description);

    setMetaTag(
      "name",
      "robots",
      noIndex
        ? "noindex, nofollow"
        : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
    );

    // Open Graph
    setMetaTag("property", "og:title", fullTitle);
    setMetaTag("property", "og:description", description);
    setMetaTag("property", "og:type", type);
    setMetaTag("property", "og:site_name", SITE_NAME);
    setMetaTag("property", "og:locale", "en_US");
    setMetaTag("property", "og:url", pageUrl);
    setMetaTag("property", "og:image", fullImage);
    setMetaTag("property", "og:image:alt", finalImageAlt);

    // Twitter / X
    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:title", fullTitle);
    setMetaTag("name", "twitter:description", description);
    setMetaTag("name", "twitter:image", fullImage);
    setMetaTag("name", "twitter:image:alt", finalImageAlt);

    setCanonicalUrl(pageUrl);
  }, [
    title,
    description,
    path,
    image,
    imageAlt,
    type,
    noIndex,
  ]);
}
