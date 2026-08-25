import { useEffect } from "react";

/**
 * Injects a JSON-LD <script type="application/ld+json"> tag into <head>
 * for the lifetime of the calling component, then removes it on unmount.
 *
 * usePageSchema({ "@context": "https://schema.org", "@type": "Service", ... });
 */
export default function useStructuredData(schema, key = "page-schema") {
  useEffect(() => {
    if (!schema) return;

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-schema-key", key);
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(schema), key]);
}
