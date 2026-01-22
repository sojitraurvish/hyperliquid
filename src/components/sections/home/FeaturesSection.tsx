import { Zap, TrendingUp, Shield, BarChart3, Lock, Globe } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 sm:p-8 hover:bg-gray-900 transition-all duration-200">
      <div className="text-green-400 mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-gray-400 text-sm sm:text-base leading-relaxed">{description}</p>
    </div>
  );
};

export const FeaturesSection = () => {
  const features = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Lightning Fast Execution',
      description: 'Sub-second trade execution with our high-performance matching engine. No more slippage or failed transactions.',
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Up to 50x Leverage',
      description: 'Amplify your trading power with industry-leading leverage options while maintaining full control over your risk.',
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Self-Custody Trading',
      description: 'Your keys, your crypto. Trade directly from your wallet without ever giving up control of your assets.',
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Deep Liquidity',
      description: 'Access to billions in liquidity across all major trading pairs. Trade large sizes with minimal slippage.',
    },
    {
      icon: <Lock className="w-8 h-8" />,
      title: 'Enterprise Security',
      description: 'Multi-signature infrastructure, regular audits, and insurance funds to protect your assets.',
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: '24/7 Global Access',
      description: 'Trade anytime, anywhere. Our platform never sleeps, giving you access to markets around the clock.',
    },
  ];

  return (
    <section className="w-full bg-gray-950 py-16 sm:py-20 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Why Traders Choose Hypertrading
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
            Experience the future of decentralized trading with our cutting-edge features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};


