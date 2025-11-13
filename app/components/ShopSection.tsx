'use client';

import { useState } from 'react';

const ShopSection = () => {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <>
      <section id="shop" className="bg-background py-12 md:py-16 px-4 md:px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="bg-background border border-primary/30 p-6 md:p-8 rounded-design text-center">
            <h2 className="text-gloock-base font-gloock text-primary mb-3 md:mb-4">
              Shop
            </h2>
            <p className="text-afacad-sm-light font-afacad text-primary max-w-[600px] mx-auto leading-[1.8] mb-6 md:mb-8">
            Which element are you missing?
            Explore wellness products designed to restore the balance your energy needs.
            </p>
            <button
              onClick={() => setShowPopup(true)}
              className="border border-primary text-primary px-6 py-3 rounded-design text-afacad-base font-afacad italic hover:bg-primary hover:text-white transition-all duration-300"
            >
              Visit Shop
            </button>
          </div>
        </div>
      </section>

      {/* Popup */}
      {showPopup && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4"
          onClick={() => setShowPopup(false)}
        >
          <div 
            className="bg-background border border-primary/30 rounded-design p-6 md:p-8 max-w-[400px] w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-gloock-base font-gloock text-primary mb-4">
              Coming Soon
            </h3>
            <p className="text-afacad-sm-light font-afacad text-primary mb-6 leading-[1.8]">
              Our products are in preparation. You'll be able to explore them soon.
            </p>
            <button
              onClick={() => setShowPopup(false)}
              className="border border-primary text-primary px-6 py-3 rounded-design text-afacad-base font-afacad italic hover:bg-primary hover:text-white transition-all duration-300"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ShopSection;

