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
      <h2 className="text-primary text-center mb-3 md:mb-4 text-gloock-base font-gloock">
        Saju (四柱)
        <br />
        Four Pillars of Destiny
      </h2>
      <p className="text-afacad-sm-light text-primary mb-6 md:mb-8 text-center px-4">
      Each pillar holds a trace of the moment you were born.
      When combined, they reveal the subtle flow of energy that shapes your rhythm and balance.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {pillarData.map((pillar, index) => (
          <div key={index} className="border border-primary/30 p-4 md:p-6 rounded-[12px]">
            <div className="text-afacad-sm text-primary/70 mb-3 md:mb-4 font-afacad">
              {pillar.title}
            </div>
            <div className="block text-[1.5em] md:text-[1.8em] text-primary my-3 md:my-4 font-nanum">
              {pillar.data.korean}
            </div>
            <div className="text-afacad-base text-primary/70 mt-1 font-hanja">
              {pillar.data.hanja}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FourPillarsDisplay;

