import SupportContainer from '@/containers/support';
import { CustomHead } from '@/components/seo';
import { ROUTES } from '@/lib/config';
import { getBaseUrl } from '@/lib/utils/get-base-url';

export default function SupportPage() {
  const metaTitle = "Support | Hyper Trading - Get Help & Contact Us";
  const metaDesc = "Get in touch with Hyper Trading support team. Have a question or want to partner with us? We'd love to hear from you.";
  const pageFullPath = `${getBaseUrl()}${ROUTES.SUPPORT}`;
  
  return (
    <>
      <CustomHead
        ogTitle={metaTitle}
        url={pageFullPath}
        description={metaDesc}
        keywords="hyperliquid support, trading help, customer service, contact hyper trading"
        title={metaTitle}
      />
      <SupportContainer />
    </>
  );
}

