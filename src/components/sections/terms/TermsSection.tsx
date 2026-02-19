"use client";

interface TermsSectionProps {
  section: {
    number: number;
    title: string;
    content: string | string[];
  };
}

export const TermsSection = ({ section }: TermsSectionProps) => {
  return (
    <div className="p-4 sm:p-6 md:p-7 bg-gray-900/30 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-800/40">
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 tracking-tight">
        <span className="text-green-400/60 mr-2">{section.number}.</span>
        {section.title}
      </h2>

      <div className="text-gray-400 text-sm sm:text-base leading-relaxed">
        {Array.isArray(section.content) ? (
          <ul className="space-y-2.5 ml-1">
            {section.content.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-green-400/50 rounded-full mt-2 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>{section.content}</p>
        )}
      </div>
    </div>
  );
};
