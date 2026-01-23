import PrivacyContainer from '@/containers/privacy';
import { CustomHead } from '@/components/seo';
import { ROUTES, WEB_URL } from '@/lib/config';

export default function PrivacyPage() {
  const metaTitle = "Privacy Policy | Hyper Trading";
  const metaDesc = "Learn how Hyper Trading protects your privacy. Our Privacy Policy explains how we collect, use, and safeguard your information on our decentralized trading platform.";
  const pageFullPath = WEB_URL + ROUTES.PRIVACY;
  
  return (
    <>
      <CustomHead
        ogTitle={metaTitle}
        url={pageFullPath}
        description={metaDesc}
        keywords="privacy policy, data protection, hyperliquid privacy, trading platform privacy"
        title={metaTitle}
      />
      <PrivacyContainer />
    </>
  );
}

