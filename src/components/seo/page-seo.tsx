import { Helmet } from "react-helmet-async";

interface PageSeoProps {
  title: string;
  description: string;
  path?: string;
  noIndex?: boolean;
}

const BASE_URL = "https://lohnpro.app";

export function PageSeo({ title, description, path = "/", noIndex = false }: PageSeoProps) {
  const fullTitle = path === "/" ? title : `${title} | LohnPro`;
  const url = `${BASE_URL}${path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
    </Helmet>
  );
}
