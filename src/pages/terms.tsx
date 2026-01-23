import TermsContainer from '@/containers/terms';
import { CustomHead } from '@/components/seo';
import { ROUTES, WEB_URL } from '@/lib/config';

export default function TermsPage() {
  const metaTitle = "Terms of Service | Hyper Trading";
  const metaDesc = "Read the Terms of Service for Hyper Trading. Understand the rules and guidelines for using our decentralized perpetual trading platform.";
  const pageFullPath = WEB_URL + ROUTES.TERMS;
  
  return (
    <>
      <CustomHead
        ogTitle={metaTitle}
        url={pageFullPath}
        description={metaDesc}
        keywords="terms of service, trading terms, hyperliquid terms, platform terms"
        title={metaTitle}
      />
      <TermsContainer />
    </>
  );
}

