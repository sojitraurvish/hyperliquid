import FAQContainer from '@/containers/faq';
import { CustomHead, CustomScriptHomePage } from '@/components/seo';
import { ROUTES, WEB_URL } from '@/lib/config';
import { faqData } from '@/components/sections/faq';

export default function FAQPage() {
  const metaTitle = "Frequently Asked Questions | Hyper Trading";
  const metaDesc = "Find answers to common questions about trading on Hyper Trading. Learn about getting started, trading, security, staking, and more.";
  const pageFullPath = WEB_URL + ROUTES.FAQ;
  
  // Extract FAQ items for structured data
  const faqSection = faqData.flatMap(category => category.items);
  
  return (
    <>
      <CustomHead
        ogTitle={metaTitle}
        url={pageFullPath}
        description={metaDesc}
        keywords="hyperliquid faq, trading questions, crypto trading help, perpetual futures guide"
        title={metaTitle}
      />
      <CustomScriptHomePage metaTitle={metaTitle} metaDesc={metaDesc} faqSection={faqSection} />
      <FAQContainer />
    </>
  );
}

