'use client';

const HeroSection = () => {
  const scrollToCalculator = () => {
    const element = document.getElementById('saju');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section 
      className="bg-background relative overflow-hidden"
      id="about"
    >
      <div className="max-w-[1200px] mx-auto relative">
        {/* 좌우 장식 점선 */}
        <div className="absolute left-2 md:left-4 top-0 bottom-0">
          <div className="h-full flex flex-col pb-5">
            <div className="w-1 h-1 bg-primary rotate-45 self-center"></div>
            <div className="flex-1 border-dashed-custom self-center"></div>
          </div>
        </div>
        <div className="absolute right-2 md:right-4 top-0 bottom-0">
          <div className="h-full flex flex-col pb-5">
            <div className="w-1 h-1 bg-primary rotate-45 self-center"></div>
            <div className="flex-1 border-dashed-custom self-center"></div>
          </div>
        </div>

        <div className="relative z-10 max-w-[600px] mx-auto px-4 pt-0 pb-5">
        {/* About 제목 */}
        <h1 className="text-gloock-base text-primary mb-8 md:mb-12 font-gloock text-center">
          About
        </h1>

        {/* 중앙 로고 */}
        <div className="flex justify-center mb-8 md:mb-12">
          <img 
            src="/logo2.svg" 
            alt="Five Flows Logo" 
            className="w-full max-w-[300px] md:max-w-[400px] h-auto"
          />
        </div>

        {/* 세로 점선 그래픽 */}
        <div className="flex flex-col items-center gap-2 mb-8 md:mb-12">
          <div className="w-1 h-1 bg-primary rotate-45"></div>
          <div className="h-12 border-dashed-custom"></div>
          <div className="w-1 h-1 bg-primary rotate-45"></div>
        </div>

        {/* 설명 텍스트 */}
        <div className="space-y-4 mb-8 md:mb-12 px-4">
          <p className="text-afacad-sm-light text-primary leading-relaxed text-center">
            Five Flows is a wellness brand that helps you understand your inner energy and restore balance through personalized rituals.
          </p>
          <p className="text-afacad-sm-light text-primary leading-relaxed text-center">
            Inspired by the <em className="font-afacad-italic">Korean philosophy of Saju</em>, we analyze your unique balance of <em className="italic font-weight-400">five elements</em>: fire, water, wood, metal, and earth. And we curate products that replenish what you lack, guiding you toward a deeper sense of wholeness and calm.
          </p>
        </div>

        {/* CTA 버튼 */}
        <div className="flex justify-center mb-8">
          <button
            onClick={scrollToCalculator}
            className="border border-primary text-primary px-6 py-3 rounded-design text-afacad-base font-afacad italic hover:bg-primary hover:text-white active:bg-primary active:text-white transition-colors duration-300"
          >
            Explore Saju test ↓
          </button>
        </div>

        {/* 가로 점선 그래픽 (CTA 버튼 아래) */}
        <div className="absolute left-2 md:left-4 right-2 md:right-4 bottom-2.5 flex items-center justify-center gap-2">
          <div className="w-1 h-1 bg-primary rotate-45"></div>
          <div className="flex-1 border-dashed-custom-horizontal"></div>
          <div className="w-1 h-1 bg-primary rotate-45"></div>
        </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

