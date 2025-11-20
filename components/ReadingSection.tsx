import React from 'react';
import { ReadingContent, TextSize } from '../types';

interface ReadingSectionProps {
  title: string;
  type: 'Primera Lectura' | 'Salmo' | 'Segunda Lectura' | 'Evangelio';
  data: ReadingContent;
  textSize: TextSize;
  colorClass: string;
}

export const ReadingSection: React.FC<ReadingSectionProps> = ({ title, type, data, textSize, colorClass }) => {
  
  // Helper to format Psalm text specifically
  const renderBodyText = () => {
    // If it is the Psalm and does not appear to have explicit paragraph breaks (double newlines)
    // We enforce the user's request to split by periods to create separate stanzas.
    if (type === 'Salmo') {
        // Check if the model already returned formatted text with newlines
        const hasNewlines = data.text.includes('\n');
        
        if (!hasNewlines) {
            // Split by period, filter out empty strings (e.g. after the last dot)
            const verses = data.text.split('.').filter(s => s.trim().length > 0);
            return (
                <div className="space-y-6">
                    {verses.map((verse, i) => (
                        <p key={i}>
                           {verse.trim()}.
                        </p>
                    ))}
                </div>
            );
        }
    }
    
    // Default behavior for other readings or if formatting exists
    return data.text;
  };

  return (
    <div className="mb-12 last:mb-0 opacity-0 animate-fade-in" style={{ animationFillMode: 'forwards' }}>
      <div className="mb-6 border-b border-stone-200 dark:border-gray-700 pb-4 text-center md:text-left">
        <span className={`text-xs font-bold tracking-[0.2em] uppercase ${colorClass} mb-2 block font-sans`}>
          {type}
        </span>
        <h2 className="text-2xl md:text-3xl font-bold text-stone-900 dark:text-stone-50 font-serif leading-tight">
          {data.title}
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-2 italic font-sans">
          {data.reference}
        </p>
      </div>

      {data.response && (
        <div className="mb-6 p-5 bg-stone-100 dark:bg-slate-800/50 rounded-xl border-l-4 border-stone-300 dark:border-slate-600">
          <p className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase mb-2 tracking-wider font-sans">Respuesta</p>
          <p className={`font-serif font-medium ${textSize} text-stone-800 dark:text-stone-200 leading-relaxed italic`}>
            "{data.response}"
          </p>
        </div>
      )}
      
      {data.acclamation && (
         <div className="mb-6 p-5 bg-stone-100 dark:bg-slate-800/50 rounded-xl border-l-4 border-stone-300 dark:border-slate-600">
           <p className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase mb-2 tracking-wider font-sans">Aclamación</p>
           <p className={`font-serif font-medium ${textSize} text-stone-800 dark:text-stone-200 leading-relaxed italic`}>
             "{data.acclamation}"
           </p>
         </div>
      )}

      <div className={`${textSize} leading-loose text-stone-800 dark:text-stone-300 font-serif whitespace-pre-wrap text-justify`}>
        {renderBodyText()}
      </div>
      
      <div className="mt-6 text-sm font-bold text-stone-400 dark:text-stone-500 font-sans border-t border-stone-100 dark:border-slate-800 pt-4">
        Palabra de Dios. <span className="font-normal italic opacity-75 ml-1">(Te alabamos Señor)</span>
      </div>
    </div>
  );
};
