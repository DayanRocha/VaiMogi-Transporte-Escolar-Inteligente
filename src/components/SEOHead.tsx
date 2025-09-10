import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
}

const SEOHead = ({
  title = 'VaiMogi - Transporte Escolar Inteligente',
  description = 'Aplicativo completo para gestão de transporte escolar com rastreamento em tempo real, comunicação entre motoristas e responsáveis, e segurança total para estudantes.',
  keywords = 'transporte escolar, rastreamento, segurança, estudantes, motoristas, responsáveis, tempo real, comunicação, gestão escolar',
  image = 'https://vaimogi.com/vai-mogi.png',
  url = 'https://vaimogi.com',
  type = 'website',
  author = 'VaiMogi',
  publishedTime,
  modifiedTime,
  section,
  tags = []
}: SEOHeadProps) => {
  const fullTitle = title.includes('VaiMogi') ? title : `${title} | VaiMogi`;
  const canonicalUrl = url.startsWith('http') ? url : `https://vaimogi.com${url}`;

  return (
    <Helmet>
      {/* Título da página */}
      <title>{fullTitle}</title>
      
      {/* Meta tags básicas */}
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      
      {/* URL canônica */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph (Facebook, LinkedIn, etc.) */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="VaiMogi" />
      <meta property="og:locale" content="pt_BR" />
      
      {/* Article specific Open Graph */}
      {type === 'article' && (
        <>
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {author && <meta property="article:author" content={author} />}
          {section && <meta property="article:section" content={section} />}
          {tags.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@vaimogi" />
      <meta name="twitter:creator" content="@vaimogi" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Structured Data para páginas específicas */}
      {type === 'website' && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": fullTitle,
            "description": description,
            "url": canonicalUrl,
            "image": image,
            "publisher": {
              "@type": "Organization",
              "name": "VaiMogi",
              "url": "https://vaimogi.com",
              "logo": "https://vaimogi.com/vai-mogi.png"
            },
            "inLanguage": "pt-BR",
            "isPartOf": {
              "@type": "WebSite",
              "name": "VaiMogi",
              "url": "https://vaimogi.com"
            }
          })}
        </script>
      )}
      
      {/* Meta tags para mobile */}
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="VaiMogi" />
      
      {/* Preload de recursos críticos para a página */}
      <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
    </Helmet>
  );
};

export default SEOHead;