interface FourPillarsDisplayProps {
  pillars: {
    year: { hanja: string; korean: string };
    month: { hanja: string; korean: string };
    day: { hanja: string; korean: string };
    hour: { hanja: string; korean: string };
  };
}

const FourPillarsDisplay = ({ pillars }: FourPillarsDisplayProps) => {
  const pillarData = [
    { title: 'Year Pillar', data: pillars.year },
    { title: 'Month Pillar', data: pillars.month },
    { title: 'Day Pillar', data: pillars.day },
    { title: 'Hour Pillar', data: pillars.hour },
  ];

  return (
    <div className="bg-background py-6 md:py-8 px-4 md:px-6 rounded-design text-center">
      <h2 className="text-primary mb-6 md:mb-8 text-gloock-base font-gloock">
        Four Pillars of Destiny
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {pillarData.map((pillar, index) => (
          <div key={index} className="bg-white p-4 md:p-6 rounded-[12px]">
            <div className="text-afacad-sm text-primary/70 mb-3 md:mb-4 font-afacad">
              {pillar.title}
            </div>
            <div className="text-[2em] md:text-[2.3em] text-primary my-3 md:my-4 font-gloock">
              {pillar.data.hanja}
            </div>
            <div className="block text-afacad-sm text-primary/70 mt-1 font-afacad">
              {pillar.data.korean}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FourPillarsDisplay;

