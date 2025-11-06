'use client'

import { useState, useRef } from 'react'

export default function CalculatorForm({ onCalculate }) {
  const [formData, setFormData] = useState({
    year: 1990,
    month: 5,
    day: 15,
    hour: 12,
    minute: 0,
    gender: 'male',
    location: '',
    timezone: ''
  })
  const [locationStatus, setLocationStatus] = useState('')
  const [isDetecting, setIsDetecting] = useState(false)
  const geocodeTimeoutRef = useRef(null)

  const handleAutoDetect = () => {
    setIsDetecting(true)
    try {
      const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (detectedTimezone) {
        setFormData(prev => ({
          ...prev,
          timezone: detectedTimezone,
          location: detectedTimezone.split('/').pop().replace(/_/g, ' ')
        }))
        setLocationStatus(`✓ Detected: ${detectedTimezone}`)
      } else {
        throw new Error('Could not detect timezone')
      }
    } catch (error) {
      setLocationStatus('⚠ Auto-detection failed. Please enter location manually.')
    } finally {
      setIsDetecting(false)
    }
  }

  const handleLocationChange = (e) => {
    const location = e.target.value.trim()
    setFormData(prev => ({ ...prev, location }))
    
    clearTimeout(geocodeTimeoutRef.current)
    
    if (location.length < 2) {
      setFormData(prev => ({ ...prev, timezone: '' }))
      setLocationStatus('')
      return
    }
    
    setLocationStatus('Searching...')
    
    geocodeTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch('/api/geocode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ location })
        })
        
        const result = await response.json()
        
        if (result.success && result.data) {
          setFormData(prev => ({ ...prev, timezone: result.data.timezone }))
          const locationDisplay = result.data.city ? 
            `${result.data.city}, ${result.data.country}` : 
            result.data.location
          setLocationStatus(`✓ Found: ${locationDisplay} (${result.data.timezone})`)
        } else {
          setFormData(prev => ({ ...prev, timezone: '' }))
          setLocationStatus('⚠ Location not found. Please try a different search term.')
        }
      } catch (error) {
        setFormData(prev => ({ ...prev, timezone: '' }))
        setLocationStatus('⚠ Search failed. Please try again.')
      }
    }, 1000)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.timezone) {
      alert('Please enter a valid location or use auto-detect.')
      return
    }
    
    onCalculate({
      year: parseInt(formData.year),
      month: parseInt(formData.month),
      day: parseInt(formData.day),
      hour: parseInt(formData.hour),
      minute: parseInt(formData.minute),
      gender: formData.gender,
      timezone: formData.timezone,
      birthplace: formData.location || 'Not provided'
    })
  }

  return (
    <div className="form-section">
      <form id="manseryeokForm" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="year">Birth Year *</label>
            <input
              type="number"
              id="year"
              min="1900"
              max="2100"
              value={formData.year}
              onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="month">Birth Month *</label>
            <input
              type="number"
              id="month"
              min="1"
              max="12"
              value={formData.month}
              onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="day">Birth Day *</label>
            <input
              type="number"
              id="day"
              min="1"
              max="31"
              value={formData.day}
              onChange={(e) => setFormData(prev => ({ ...prev, day: e.target.value }))}
              required
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="hour">Birth Hour *</label>
            <input
              type="number"
              id="hour"
              min="0"
              max="23"
              value={formData.hour}
              onChange={(e) => setFormData(prev => ({ ...prev, hour: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="minute">Birth Minute *</label>
            <input
              type="number"
              id="minute"
              min="0"
              max="59"
              value={formData.minute}
              onChange={(e) => setFormData(prev => ({ ...prev, minute: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="gender">Gender *</label>
            <select
              id="gender"
              value={formData.gender}
              onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
              required
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="location">Birth Location *</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                id="location"
                placeholder="e.g., Seoul, New York, London, Tokyo..."
                value={formData.location}
                onChange={handleLocationChange}
                required
                style={{ flex: 1 }}
              />
              <button
                type="button"
                id="autoDetectBtn"
                onClick={handleAutoDetect}
                disabled={isDetecting}
                style={{
                  padding: '14px 20px',
                  background: 'var(--color-secondary)',
                  color: 'var(--color-primary)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontSize: '14px',
                  letterSpacing: '0.5px'
                }}
              >
                {isDetecting ? 'Detecting...' : 'Auto-detect'}
              </button>
            </div>
            <div id="locationStatus" style={{ marginTop: '8px', fontSize: '0.9em', color: 'var(--color-secondary)', opacity: 0.8 }}>
              {locationStatus}
            </div>
          </div>
        </div>
        
        <button type="submit" className="btn-submit">Calculate Saju</button>
      </form>
    </div>
  )
}

