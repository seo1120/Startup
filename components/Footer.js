'use client'

export default function Footer() {
  const handleScroll = (e, targetId) => {
    e.preventDefault()
    const target = document.querySelector(targetId)
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }
  }

  return (
    <footer className="footer" id="about">
      <div className="footer-container">
        <div className="footer-logo">FIVE FLOWS</div>
        <p className="footer-description">
          A modern interpretation of traditional wisdom for accurate Four Pillars analysis.<br />
          Providing insights for a balanced life in harmony with natural rhythms.
        </p>
        <div className="footer-links">
          <a href="#home" onClick={(e) => handleScroll(e, '#home')}>Home</a>
          <a href="#calculator" onClick={(e) => handleScroll(e, '#calculator')}>Calculate</a>
          <a href="#about" onClick={(e) => handleScroll(e, '#about')}>About</a>
        </div>
        <div className="footer-bottom">
          © 2025 Five Flows. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

