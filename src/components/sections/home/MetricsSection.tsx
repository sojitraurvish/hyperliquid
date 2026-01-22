import { TrendingUp, DollarSign, Users, BarChart3 } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
}

const MetricCard = ({ title, value, change, icon }: MetricCardProps) => {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 hover:bg-gray-900 transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="text-gray-400 text-sm font-medium">{title}</div>
        <div className="text-green-400">{icon}</div>
      </div>
      <div className="text-2xl sm:text-3xl font-bold text-white mb-2">{value}</div>
      <div className="text-sm text-green-400 font-medium">{change}</div>
    </div>
  );
};

export const MetricsSection = () => {
  const metrics = [
    {
      title: '24h Trading Volume',
      value: '$1.09B',
      change: '+12.5%',
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      title: 'Total Value Locked',
      value: '$458M',
      change: '+8.2%',
      icon: <DollarSign className="w-5 h-5" />,
    },
    {
      title: 'Active Traders',
      value: '125,000+',
      change: '+5,200 this week',
      icon: <Users className="w-5 h-5" />,
    },
    {
      title: 'Open Interest',
      value: '$892M',
      change: '+3.8%',
      icon: <BarChart3 className="w-5 h-5" />,
    },
  ];

  return (
    <section className="w-full bg-gray-950 py-12 sm:py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {metrics.map((metric, index) => (
            <MetricCard key={index} {...metric} />
          ))}
        </div>
      </div>
    </section>
  );
};


