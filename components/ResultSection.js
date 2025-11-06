'use client'

import { useState, useEffect, useRef } from 'react'
import ChatSection from './ChatSection'

export default function ResultSection({ data, currentSajuData }) {
  const [elementBars, setElementBars] = useState({
    wood: 0,
    fire: 0,
    earth: 0,
    metal: 0,
    water: 0
  })

  useEffect(() => {
    if (data && data.fiveElements) {
      const maxCount = Math.max(...Object.values(data.fiveElements.elements))
      const elementMap = {
        '목': 'wood',
        '화': 'fire',
        '토': 'earth',
        '금': 'metal',
        '수': 'water'
      }
      
      const newBars = {}
      Object.entries(data.fiveElements.elements).forEach(([element, count]) => {
        const english = elementMap[element]
        if (english) {
          newBars[english] = {
            count,
            width: maxCount > 0 ? (count / maxCount * 100) : 0
          }
        }
      })
      
      setTimeout(() => {
        setElementBars(newBars)
      }, 100)
    }
  }, [data])

  const getElementAdvice = (element, strength, missing) => {
    let advice = ''
    const elementNames = {'목': 'Wood', '화': 'Fire', '토': 'Earth', '금': 'Metal', '수': 'Water'}
    
    if (strength === '약') {
      advice += `Your Day Master is weak, so strengthening the ${elementNames[element]} element would be beneficial. `
    } else if (strength === '강') {
      advice += `Your Day Master is strong, so maintaining balance is important. `
    }
    
    if (missing.length > 0) {
      const missingNames = missing.map(e => elementNames[e]).join(', ')
      advice += `Consider supplementing the missing elements (${missingNames}) to achieve better balance.`
    } else {
      advice += `Your elements are well-distributed.`
    }
    
    return advice
  }

  if (!data) return null

  const elementNames = {'목': 'Wood', '화': 'Fire', '토': 'Earth', '금': 'Metal', '수': 'Water'}
  const strengthNames = {'강': 'Strong', '중': 'Moderate', '약': 'Weak'}
  const dayMaster = data.fiveElements.dayMaster

  return (
    <div className="result-section show">
      <div className="pillars-display">
        <h2>Four Pillars of Destiny</h2>
        <div className="four-pillars">
          <div className="pillar">
            <div className="pillar-title">Year Pillar</div>
            <div className="pillar-hanja">{data.pillars.year.hanja}</div>
            <div className="pillar-korean">{data.pillars.year.korean}</div>
          </div>
          <div className="pillar">
            <div className="pillar-title">Month Pillar</div>
            <div className="pillar-hanja">{data.pillars.month.hanja}</div>
            <div className="pillar-korean">{data.pillars.month.korean}</div>
          </div>
          <div className="pillar">
            <div className="pillar-title">Day Pillar</div>
            <div className="pillar-hanja">{data.pillars.day.hanja}</div>
            <div className="pillar-korean">{data.pillars.day.korean}</div>
          </div>
          <div className="pillar">
            <div className="pillar-title">Hour Pillar</div>
            <div className="pillar-hanja">{data.pillars.hour.hanja}</div>
            <div className="pillar-korean">{data.pillars.hour.korean}</div>
          </div>
        </div>
      </div>
      
      <div className="info-grid">
        <div className="info-card">
          <h3>Date Information</h3>
          <div className="info-item">
            <span className="info-label">Solar Calendar</span>
            <span className="info-value">
              <strong>{data.solar.year}.{data.solar.month}.{data.solar.day}</strong>
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Lunar Calendar</span>
            <span className="info-value">
              <strong>{data.lunar.year}.{data.lunar.month}.{data.lunar.day}</strong>
              {data.lunar.isLeapMonth && ' <em>(Leap Month)</em>'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Day of Week</span>
            <span className="info-value">
              <strong>{data.additional.weekday.korean}</strong> ({data.additional.weekday.hanja})
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">28 Mansions</span>
            <span className="info-value">
              {data.additional.star28 ? <strong>{data.additional.star28}</strong> : '-'}
            </span>
          </div>
        </div>
        
        <div className="info-card">
          <h3>Personal Information</h3>
          <div className="info-item">
            <span className="info-label">Zodiac</span>
            <span className="info-value">
              <strong>{data.additional.zodiac}</strong>
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Gender</span>
            <span className="info-value">
              <strong>{data.input.gender === 'male' ? 'Male' : 'Female'}</strong>
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Birthplace</span>
            <span className="info-value">
              <strong>{data.input.birthplace}</strong>
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Solar Term</span>
            <span className="info-value">
              {data.additional.solarTerm ? <strong>{data.additional.solarTerm}</strong> : '-'}
            </span>
          </div>
        </div>
        
        <div className="info-card">
          <h3>Time Information</h3>
          {data.input.original && data.input.adjusted && (
            <>
              <div className="info-item">
                <span className="info-label">Local Time</span>
                <span className="info-value">
                  <strong>{data.input.original.dateString} {data.input.original.timeString}</strong>
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Timezone</span>
                <span className="info-value">
                  <strong>{data.input.timezone.split('/').pop().replace(/_/g, ' ')}</strong>
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Adjusted Time</span>
                <span className="info-value">
                  <strong>{data.input.adjusted.dateString} {data.input.adjusted.timeString}</strong> <em>(KST)</em>
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="info-card">
        <h3>Five Elements Analysis</h3>
        <div className="elements-chart">
          <div className="element-bar">
            <span className="element-name">Wood</span>
            <div className="bar-container">
              <div 
                className="bar-fill bar-wood" 
                style={{ width: `${elementBars.wood?.width || 0}%` }}
              >
                {elementBars.wood?.count || 0}
              </div>
            </div>
          </div>
          <div className="element-bar">
            <span className="element-name">Fire</span>
            <div className="bar-container">
              <div 
                className="bar-fill bar-fire" 
                style={{ width: `${elementBars.fire?.width || 0}%` }}
              >
                {elementBars.fire?.count || 0}
              </div>
            </div>
          </div>
          <div className="element-bar">
            <span className="element-name">Earth</span>
            <div className="bar-container">
              <div 
                className="bar-fill bar-earth" 
                style={{ width: `${elementBars.earth?.width || 0}%` }}
              >
                {elementBars.earth?.count || 0}
              </div>
            </div>
          </div>
          <div className="element-bar">
            <span className="element-name">Metal</span>
            <div className="bar-container">
              <div 
                className="bar-fill bar-metal" 
                style={{ width: `${elementBars.metal?.width || 0}%` }}
              >
                {elementBars.metal?.count || 0}
              </div>
            </div>
          </div>
          <div className="element-bar">
            <span className="element-name">Water</span>
            <div className="bar-container">
              <div 
                className="bar-fill bar-water" 
                style={{ width: `${elementBars.water?.width || 0}%` }}
              >
                {elementBars.water?.count || 0}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="analysis-card">
        <h3>Day Master Analysis</h3>
        <div className="analysis-content">
          <p><strong>Day Master</strong>: {dayMaster.stem} ({elementNames[dayMaster.element]} Element)</p>
          <p><strong>Strength</strong>: {strengthNames[dayMaster.strength]}</p>
          
          <h3>Element Distribution</h3>
          <ul>
            <li><strong>Dominant Element</strong>: {elementNames[data.fiveElements.dominant]}</li>
            <li><strong>Missing Elements</strong>: {data.fiveElements.missing.map(e => elementNames[e]).join(', ') || 'None'}</li>
          </ul>
          
          <h3>Recommendations</h3>
          <p>{getElementAdvice(dayMaster.element, dayMaster.strength, data.fiveElements.missing)}</p>
        </div>
      </div>
      
      {currentSajuData && (
        <ChatSection currentSajuData={currentSajuData} />
      )}
    </div>
  )
}

