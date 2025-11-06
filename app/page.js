'use client'

import { useState, useRef, useEffect } from 'react'
import Navigation from '@/components/Navigation'
import HeroSection from '@/components/HeroSection'
import CalculatorForm from '@/components/CalculatorForm'
import ResultSection from '@/components/ResultSection'
import Footer from '@/components/Footer'

export default function Home() {
  const [resultData, setResultData] = useState(null)
  const [currentSajuData, setCurrentSajuData] = useState(null)
  const [error, setError] = useState(null)
  const resultSectionRef = useRef(null)
  const backgroundRef = useRef(null)

  useEffect(() => {
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (backgroundRef.current) {
            const scrolled = window.pageYOffset || window.scrollY || document.documentElement.scrollTop
            const parallaxSpeed = -0.3 // 30% 속도 (반대 방향)
            backgroundRef.current.style.transform = `translateY(${scrolled * parallaxSpeed}px)`
          }
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleCalculate = async (formData) => {
    try {
      const response = await fetch('/api/manseryeok', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      const result = await response.json()
      
      if (result.success) {
        setResultData(result.data)
        setError(null)
        
        // 사주 데이터를 채팅용 형식으로 변환
        const elementMap = {
          '목': 'wood',
          '화': 'fire',
          '토': 'earth',
          '금': 'metal',
          '수': 'water'
        }
        
        const fiveElementsObj = {}
        Object.entries(result.data.fiveElements.elements).forEach(([korean, count]) => {
          const english = elementMap[korean]
          if (english) {
            fiveElementsObj[english] = count
          }
        })
        
        setCurrentSajuData({
          year_pillar: result.data.pillars.year.korean,
          month_pillar: result.data.pillars.month.korean,
          day_pillar: result.data.pillars.day.korean,
          hour_pillar: result.data.pillars.hour.korean,
          five_elements: fiveElementsObj
        })
        
        // 결과 섹션으로 스크롤
        setTimeout(() => {
          resultSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
      } else {
        setError(result.error)
        setResultData(null)
      }
    } catch (error) {
      setError('Failed to connect to server. Please check if the server is running.')
      console.error('Error:', error)
    }
  }

  return (
    <div className="page-wrapper">
      <div className="background-image" ref={backgroundRef}></div>
      <Navigation />
      <HeroSection />
      <div className="main-container">
        <div className="container" id="calculator">
          <div className="content">
            <CalculatorForm onCalculate={handleCalculate} />
            {error && (
              <div className="error-message show">
                {error}
              </div>
            )}
            {resultData && (
              <div ref={resultSectionRef}>
                <ResultSection 
                  data={resultData} 
                  currentSajuData={currentSajuData}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

