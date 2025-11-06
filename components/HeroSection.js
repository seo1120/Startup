'use client'

export default function HeroSection() {
  const handleScrollToCalculator = (e) => {
    e.preventDefault()
    const calculator = document.querySelector('#calculator')
    if (calculator) {
      calculator.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <section className="hero-section" id="home">
      <div className="hero-card">
        <div className="hero-content">
          <div className="hero-left">
            <h1 className="hero-title">Five Flows</h1>
            <p className="hero-subtitle">Find balance in the flow of five elements.</p>
          </div>
          <div className="hero-right">
            <div className="hero-description">
              <p>
                Five Flows is A wellness brand that helps you find inner balance and harmony.
              </p>
              <p>
                Discover your elemental energy through the traditional Korean Saju test, which interprets your natural balance of the five elements — fire, water, wood, metal, and earth. Rooted in the belief that each person's energy is shaped by their birth moment, Saju offers insight into how your inner flow and fortune can return to harmony.
              </p>
              <p>
                Carry ritual products designed to replenish your missing elements and experience a wellness journey that restores both balance and vitality.
              </p>
            </div>
            <div className="hero-button-container">
              <a href="#calculator" onClick={handleScrollToCalculator} className="hero-button">
                Explore Saju test ↓
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

