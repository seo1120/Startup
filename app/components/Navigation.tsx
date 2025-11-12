'use client';

import { useState } from 'react';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setIsMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className="sticky top-0 z-[1000] py-6 px-4">
      <div className="flex justify-center">
        {/* 중앙 pill shape 바 */}
        <div className="bg-primary/85 backdrop-blur-[3px] rounded-design h-[44px] px-4 flex items-center justify-between w-full max-w-[600px]">
          {/* 왼쪽: Five Flows 로고 */}
          <a 
            href="#" 
            className="text-background text-gloock-base font-gloock no-underline"
          >
            Five Flows
          </a>
          
          {/* 오른쪽: 햄버거 메뉴 */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-background flex flex-col gap-1.5 items-center justify-center"
            aria-label="Menu"
          >
            <span className="w-5 h-0.5 bg-background"></span>
            <span className="w-5 h-0.5 bg-background"></span>
            <span className="w-5 h-0.5 bg-background"></span>
          </button>
        </div>
      </div>
      
      {/* 드롭다운 메뉴 */}
      {isMenuOpen && (
        <div className="absolute top-44px left-4 right-4 flex justify-center mt-2">
          <div className="bg-background/85 backdrop-blur-[4px] rounded-design-sm shadow-[0_4px_12px_rgba(0,0,0,0.10)] w-full max-w-[600px] py-3 px-6">
            <ul className="flex flex-col">
              <li className="border-b border-dashed border-primary/30 pb-2 mb-2 last:border-b-0 last:pb-0 last:mb-0">
                <a 
                  href="#home" 
                  onClick={(e) => scrollToSection(e, 'home')}
                  className="no-underline text-primary text-afacad-base font-afacad block text-center hover:opacity-70 transition-opacity"
                >
                  Home
                </a>
              </li>
              <li className="border-b border-dashed border-primary/30 pb-2 mb-2 last:border-b-0 last:pb-0 last:mb-0">
                <a 
                  href="#calculator" 
                  onClick={(e) => scrollToSection(e, 'calculator')}
                  className="no-underline text-primary text-afacad-base font-afacad block text-center hover:opacity-70 transition-opacity"
                >
                  Calculate
                </a>
              </li>
              <li className="border-b border-dashed border-primary/30 pb-2 mb-2 last:border-b-0 last:pb-0 last:mb-0">
                <a 
                  href="#about" 
                  onClick={(e) => scrollToSection(e, 'about')}
                  className="no-underline text-primary text-afacad-base font-afacad block text-center hover:opacity-70 transition-opacity"
                >
                  About
                </a>
              </li>
            </ul>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;

