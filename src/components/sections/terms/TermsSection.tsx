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
    <div>
      {/* Section Number and Title */}
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
        {section.number}. {section.title}
      </h2>

      {/* Section Content */}
      <div className="text-gray-400 text-sm sm:text-base leading-relaxed">
        {Array.isArray(section.content) ? (
          <ul className="list-disc list-inside space-y-2 ml-4">
            {section.content.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        ) : (
          <p>{section.content}</p>
        )}
      </div>
    </div>
  );
};




