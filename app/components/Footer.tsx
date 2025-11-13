'use client';

const Footer = () => {
  return (
    <footer className="bg-primary text-white py-[70px] pb-9 mt-[100px]" id="about">
      <div className="max-w-[1200px] mx-auto px-5 text-center">
        <div className="text-gloock-base font-gloock mb-6 text-white">
          Five Flows
        </div>
        <p className="text-afacad-sm-light mb-9 opacity-85 max-w-[650px] mx-auto leading-[1.8] font-afacad">
          A modern interpretation of traditional wisdom for accurate Four Pillars analysis.<br />
          Providing insights for a balanced life in harmony with natural rhythms.
        </p>
        <div className="border-t border-white/20 pt-8 opacity-70 text-afacad-sm font-afacad">
          © 2025 Five Flows. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;

