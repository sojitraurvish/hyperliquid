import React from 'react';
import { SEO_SCHEMA } from '@/lib/config';
import { SEO_LOGO, WEB_URL } from '@/lib/config';
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
              "URL": ${JSON.stringify(WEB_URL)},
              "contactPoint": [
                {
                  "@type": ${JSON.stringify(SEO_SCHEMA.CONTACT_POINT.TYPE)},
                  "telephone": ${JSON.stringify(SEO_SCHEMA.CONTACT_POINT.TELEPHONE)},
                  "contactType": ${JSON.stringify(SEO_SCHEMA.CONTACT_POINT.CONTACT_TYPE)}
                }
              ],
              "logo": ${JSON.stringify(SEO_LOGO)},
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
              "url": ${JSON.stringify(WEB_URL)},
              "image": ${JSON.stringify(SEO_LOGO)},
              "potentialAction": {
                "@type": "SearchAction",
                "target": ${JSON.stringify(`${WEB_URL}/search?q={search_term_string}`)},
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

