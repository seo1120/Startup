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
    wood: 'rgba(171, 122, 32, 0.6)',
    fire: 'rgba(214, 79, 79, 0.6)',
    earth: 'rgba(234, 211, 108, 0.6)',
    metal: 'rgba(164, 164, 164, 0.6)',
    water: 'rgba(154, 192, 208, 0.6)',
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
      <h3 className="text-primary text-center mb-3 md:mb-4 text-gloock-base font-gloock">
        The Five Flows
      </h3>
      <p className="text-afacad-sm-light text-primary mb-4 md:mb-6 text-center px-4">
        Each element represents a unique flow of energy. This chart helps you see which energies are strong and which need restoration.
      </p>
      <div className="bg-background p-4 md:p-6 rounded-[12px]">
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
                <div className="flex-1 h-[28px] md:h-[36px] bg-white rounded-[18px] md:rounded-[22.5px] overflow-hidden">
                  {widths[key] > 0 && (
                    <div
                      className="h-full flex items-center justify-end pr-2 md:pr-2.5 text-primary font-afacad transition-all duration-1000"
                      style={{ 
                        width: `${widths[key]}%`,
                        backgroundColor: color
                      }}
                    >
                      {count}
                    </div>
                  )}
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

