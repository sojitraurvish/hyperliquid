import TermsContainer from '@/containers/terms';
import { CustomHead } from '@/components/seo';
import { ROUTES } from '@/lib/config';
import { getBaseUrl } from '@/lib/utils/get-base-url';

export default function TermsPage() {
  const metaTitle = "Terms of Service | Hyper Trading";
  const metaDesc = "Read the Terms of Service for Hyper Trading. Understand the rules and guidelines for using our decentralized perpetual trading platform.";
  const pageFullPath = `${getBaseUrl()}${ROUTES.TERMS}`;
  
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

