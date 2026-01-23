import SupportContainer from '@/containers/support';
import { CustomHead } from '@/components/seo';
import { ROUTES, WEB_URL } from '@/lib/config';

export default function SupportPage() {
  const metaTitle = "Support | Hyper Trading - Get Help & Contact Us";
  const metaDesc = "Get in touch with Hyper Trading support team. Have a question or want to partner with us? We'd love to hear from you.";
  const pageFullPath = WEB_URL + ROUTES.SUPPORT;
  
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

