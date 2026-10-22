import {
  SITE_DEFAULT_DESCRIPTION,
  SITE_NAME,
  SITE_NAME_FULL,
} from "@/lib/site-url";

type SiteJsonLdProps = {
  siteUrl: string;
};

export function SiteJsonLd({ siteUrl }: SiteJsonLdProps) {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: SITE_NAME,
        alternateName: [SITE_NAME_FULL, "opensourceapp", "Open Source App"],
        url: siteUrl,
        description: SITE_DEFAULT_DESCRIPTION,
        inLanguage: "en",
        publisher: { "@id": `${siteUrl}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteUrl}/apps?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: SITE_NAME,
        alternateName: [SITE_NAME_FULL, "opensourceapp"],
        url: siteUrl,
        logo: `${siteUrl}/favicon.ico`,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
