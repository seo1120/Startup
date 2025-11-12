'use client';

import { useEffect, useState } from 'react';

interface FiveElementsChartProps {
  elements: {
    목?: number;
    화?: number;
    토?: number;
    금?: number;
    수?: number;
  };
}

const FiveElementsChart = ({ elements }: FiveElementsChartProps) => {
  const [widths, setWidths] = useState({
    wood: 0,
    fire: 0,
    earth: 0,
    metal: 0,
    water: 0,
  });

  const elementMap: { [key: string]: string } = {
    목: 'wood',
    화: 'fire',
    토: 'earth',
    금: 'metal',
    수: 'water',
  };

  const elementNames: { [key: string]: string } = {
    목: 'Wood',
    화: 'Fire',
    토: 'Earth',
    금: 'Metal',
    수: 'Water',
  };

  const elementColors: { [key: string]: string } = {
    wood: 'from-[#a8b89a] to-[#c5d0b8]',
    fire: 'from-[#d4a574] to-[#e6c19a]',
    earth: 'from-[#b8a082] to-[#d4c4a8]',
    metal: 'from-[#9e9e9e] to-[#bdbdbd]',
    water: 'from-[#8b9a7a] to-[#a8b89a]',
  };

  useEffect(() => {
    const maxCount = Math.max(...Object.values(elements).filter(v => v !== undefined) as number[]);
    
    const newWidths: typeof widths = {
      wood: 0,
      fire: 0,
      earth: 0,
      metal: 0,
      water: 0,
    };

    Object.entries(elements).forEach(([element, count]) => {
      const key = elementMap[element] as keyof typeof widths;
      if (key && count !== undefined) {
        newWidths[key] = maxCount > 0 ? (count / maxCount) * 100 : 0;
      }
    });

    setTimeout(() => {
      setWidths(newWidths);
    }, 100);
  }, [elements]);

  return (
    <div className="bg-background p-4 md:p-6 rounded-design">
      <h3 className="text-primary mb-4 md:mb-6 text-gloock-base font-gloock">
        Five Elements Analysis
      </h3>
      <div className="bg-white p-4 md:p-6 rounded-[12px]">
        {Object.entries(elements).map(([element, count]) => {
          const key = elementMap[element] as keyof typeof widths;
          const name = elementNames[element];
          const color = elementColors[key] || '';
          
          return (
            <div key={element} className="mb-3 md:mb-4 last:mb-0">
              <div className="flex items-center gap-3 md:gap-4">
                <span className="inline-block w-[60px] md:w-[70px] font-afacad text-primary text-afacad-sm md:text-afacad-base">
                  {name}
                </span>
                <div className="flex-1 h-[24px] md:h-[30px] bg-background rounded-[12px] md:rounded-[15px] overflow-hidden border border-gray-200">
                  <div
                    className={`h-full flex items-center justify-end pr-2 md:pr-2.5 text-white font-bold transition-all duration-1000 bg-gradient-to-r ${color}`}
                    style={{ width: `${widths[key]}%` }}
                  >
                    {count}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FiveElementsChart;

