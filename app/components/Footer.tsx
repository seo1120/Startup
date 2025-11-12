'use client';

const Footer = () => {
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <footer className="bg-primary text-white py-[70px] pb-9 mt-[100px]" id="about">
      <div className="max-w-[1200px] mx-auto px-5 text-center">
        <div className="text-gloock-base font-gloock mb-6 text-white">
          FIVE FLOWS
        </div>
        <p className="text-afacad-base mb-9 opacity-85 max-w-[650px] mx-auto leading-[1.8] font-afacad">
          A modern interpretation of traditional wisdom for accurate Four Pillars analysis.<br />
          Providing insights for a balanced life in harmony with natural rhythms.
        </p>
        <div className="flex flex-col md:flex-row justify-center gap-5 md:gap-10 mb-8">
          <a
            href="#home"
            onClick={(e) => scrollToSection(e, 'home')}
            className="text-white no-underline opacity-80 transition-opacity duration-300 hover:opacity-100 text-afacad-base font-afacad"
          >
            Home
          </a>
          <a
            href="#calculator"
            onClick={(e) => scrollToSection(e, 'calculator')}
            className="text-white no-underline opacity-80 transition-opacity duration-300 hover:opacity-100 text-afacad-base font-afacad"
          >
            Calculate
          </a>
          <a
            href="#about"
            onClick={(e) => scrollToSection(e, 'about')}
            className="text-white no-underline opacity-80 transition-opacity duration-300 hover:opacity-100 text-afacad-base font-afacad"
          >
            About
          </a>
        </div>
        <div className="border-t border-white/20 pt-8 opacity-70 text-afacad-sm font-afacad">
          © 2025 Five Flows. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;

