import React from 'react';
import { SEO_SCHEMA, DESK_LOGO } from '@/lib/config';
import { getBaseUrl, getAbsoluteUrl } from '@/lib/utils/get-base-url';
import Head from 'next/head';

interface FAQItem {
  question: string;
  answer: string;
}

interface CustomScriptHomePageProps {
  metaTitle: string;
  metaDesc: string;
  faqSection?: FAQItem[];
}

const CustomScriptHomePage = ({ metaTitle, metaDesc, faqSection }: CustomScriptHomePageProps) => {
  // Get current site base URL (not Hyperliquid app URL)
  const baseUrl = getBaseUrl();
  const siteLogo = getAbsoluteUrl(DESK_LOGO);
  
  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: `[
            {
              "@context": ${JSON.stringify(SEO_SCHEMA.CONTEXT)},
              "@type": ${JSON.stringify(SEO_SCHEMA.TYPE)},
              "Name": ${JSON.stringify(SEO_SCHEMA.NAME)},
              "URL": ${JSON.stringify(baseUrl)},
              "contactPoint": [
                {
                  "@type": ${JSON.stringify(SEO_SCHEMA.CONTACT_POINT.TYPE)},
                  "telephone": ${JSON.stringify(SEO_SCHEMA.CONTACT_POINT.TELEPHONE)},
                  "contactType": ${JSON.stringify(SEO_SCHEMA.CONTACT_POINT.CONTACT_TYPE)}
                }
              ],
              "logo": ${JSON.stringify(siteLogo)},
              "sameAs": [
                ${JSON.stringify(SEO_SCHEMA.SAME_AS[0])},
                ${JSON.stringify(SEO_SCHEMA.SAME_AS[1])}
              ]
            },
            {
              "@context": ${JSON.stringify(SEO_SCHEMA.CONTEXT)},
              "@type": ${JSON.stringify(SEO_SCHEMA.TYPE_PRIMARY)},
              "name": ${JSON.stringify(metaTitle)},
              "description": ${JSON.stringify(metaDesc)},
              "url": ${JSON.stringify(baseUrl)},
              "image": ${JSON.stringify(siteLogo)},
              "potentialAction": {
                "@type": "SearchAction",
                "target": ${JSON.stringify(`${baseUrl}/search?q={search_term_string}`)},
                "query-input": "required name=search_term_string"
              }
            }${faqSection && faqSection.length > 0 ? `,
            {
              "@context": ${JSON.stringify(SEO_SCHEMA.CONTEXT)},
              "@type": ${JSON.stringify(SEO_SCHEMA.TYPE_SECONDARY)},
              "mainEntity": ${JSON.stringify(faqSection.map(faq => ({
                "@type": SEO_SCHEMA.TYPE_TERTIARY,
                "name": faq?.question,
                "acceptedAnswer": {
                  "@type": SEO_SCHEMA.TYPE_QUATERNARY,
                  "text": faq?.answer
                }
              })))}
            }` : ''}
          ]`
        }}
      />
    </Head>
  );
};

export default CustomScriptHomePage;

