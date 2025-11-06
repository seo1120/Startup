'use client'

import { useState } from 'react'

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleScroll = (e, targetId) => {
    e.preventDefault()
    const target = document.querySelector(targetId)
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
      setIsMenuOpen(false)
    }
  }

  return (
    <>
      <div 
        className={`mobile-menu-overlay ${isMenuOpen ? 'active' : ''}`}
        onClick={() => setIsMenuOpen(false)}
      />
      <nav className="navbar">
        <div className="nav-container">
          <a href="#" className="logo" onClick={(e) => handleScroll(e, '#home')}>
            Five Flows
          </a>
          <button 
            className={`mobile-menu-toggle ${isMenuOpen ? 'mobile-open' : ''}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <ul className={`nav-links ${isMenuOpen ? 'mobile-open' : ''}`}>
            <li><a href="#calculator" onClick={(e) => handleScroll(e, '#calculator')}>SAJU</a></li>
            <li><a href="#shop" onClick={(e) => handleScroll(e, '#shop')}>SHOP</a></li>
            <li><a href="#about" onClick={(e) => handleScroll(e, '#about')}>ABOUT</a></li>
          </ul>
        </div>
      </nav>
    </>
  )
}

