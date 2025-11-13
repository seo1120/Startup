'use client';

import { useState, useRef, useEffect } from 'react';

interface CalculatorFormProps {
  onSubmit: (formData: any) => void;
  isLoading: boolean;
  error: string | null;
}

const CalculatorForm = ({ onSubmit, isLoading, error }: CalculatorFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    year: '',
    month: '',
    day: '',
    hour: '',
    minute: '',
    gender: 'male',
    location: '',
    timezone: '',
  });

  const [locationStatus, setLocationStatus] = useState('');
  const geocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleAutoDetect = async () => {
    try {
      const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detectedTimezone) {
        setFormData(prev => ({
          ...prev,
          timezone: detectedTimezone,
          location: detectedTimezone.split('/').pop()?.replace(/_/g, ' ') || '',
        }));
        setLocationStatus(`✓ Detected: ${detectedTimezone}`);
      }
    } catch (err) {
      setLocationStatus('⚠ Auto-detection failed. Please enter location manually.');
    }
  };

  const handleLocationInput = (value: string) => {
    setFormData(prev => ({ ...prev, location: value }));

    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }

    if (value.length < 2) {
      setFormData(prev => ({ ...prev, timezone: '' }));
      setLocationStatus('');
      return;
    }

    setLocationStatus('Searching...');

    geocodeTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch('/api/geocode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ location: value }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.message || `Server error: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
          setFormData(prev => ({ ...prev, timezone: result.data.timezone }));
          const locationDisplay = result.data.city
            ? `${result.data.city}, ${result.data.country}`
            : result.data.location;
          setLocationStatus(`✓ Found: ${locationDisplay} (${result.data.timezone})`);
        } else {
          setFormData(prev => ({ ...prev, timezone: '' }));
          setLocationStatus('⚠ Location not found. Please try a different search term.');
        }
      } catch (err: any) {
        console.error('Geocode error:', err);
        setFormData(prev => ({ ...prev, timezone: '' }));
        setLocationStatus(`⚠ Search failed: ${err.message || 'Please try again.'}`);
      }
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.timezone) {
      alert('Please enter a valid location or use auto-detect.');
      return;
    }

    onSubmit({
      name: formData.name,
      year: parseInt(formData.year.toString()) || 0,
      month: parseInt(formData.month.toString()) || 0,
      day: parseInt(formData.day.toString()) || 0,
      hour: parseInt(formData.hour.toString()) || 0,
      minute: parseInt(formData.minute.toString()) || 0,
      gender: formData.gender,
      timezone: formData.timezone,
      birthplace: formData.location || 'Not provided',
    });
  };

  useEffect(() => {
    return () => {
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="px-4 pt-0 pb-4 md:px-10 md:pt-4 md:pb-10">
      <h1 className="text-gloock-base text-primary mb-3 md:mb-4 font-gloock text-center">
        Saju
      </h1>
      <p className="text-afacad-sm-light text-primary text-center mb-6 md:mb-6 px-4">
        Discover your unique energy balance through the traditional Korean practice of Saju, which analyzes your birth chart based on the five elements.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4 md:gap-5 mb-3 md:mb-5">
          <div className="flex flex-col">
            <label htmlFor="name" className="font-afacad mb-2.5 text-primary text-afacad-sm">
              Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              className="form-input"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="gender" className="font-afacad mb-2.5 text-primary text-afacad-sm">
              Gender *
            </label>
            <select
              id="gender"
              value={formData.gender}
              onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
              required
              className="form-input"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-3 gap-4 md:gap-5 mb-3 md:mb-5">
          <div className="flex flex-col">
            <label htmlFor="year" className="font-afacad mb-2.5 text-primary text-afacad-sm">
              Birth Year *
            </label>
            <input
              type="number"
              id="year"
              min="1900"
              max="2100"
              value={formData.year}
              placeholder="1990"
              onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
              required
              className="form-input no-spinner"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="month" className="font-afacad mb-2.5 text-primary text-afacad-sm">
              Birth Month *
            </label>
            <input
              type="number"
              id="month"
              min="1"
              max="12"
              value={formData.month}
              placeholder="5"
              onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))}
              required
              className="form-input no-spinner"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="day" className="font-afacad mb-2.5 text-primary text-afacad-sm">
              Birth Day *
            </label>
            <input
              type="number"
              id="day"
              min="1"
              max="31"
              value={formData.day}
              placeholder="15"
              onChange={(e) => setFormData(prev => ({ ...prev, day: e.target.value }))}
              required
              className="form-input no-spinner"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 mb-4 md:mb-5">
          <div className="grid grid-cols-2 gap-4 md:gap-5">
            <div className="flex flex-col">
              <label htmlFor="hour" className="font-afacad mb-2.5 text-primary text-afacad-sm">
                Birth Hour *
              </label>
              <input
                type="number"
                id="hour"
                min="0"
                max="23"
                value={formData.hour}
                placeholder="12"
                onChange={(e) => setFormData(prev => ({ ...prev, hour: e.target.value }))}
                required
                className="form-input no-spinner"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="minute" className="font-afacad mb-2.5 text-primary text-afacad-sm">
                Birth Minute *
              </label>
              <input
                type="number"
                id="minute"
                min="0"
                max="59"
                value={formData.minute}
                placeholder="0"
                onChange={(e) => setFormData(prev => ({ ...prev, minute: e.target.value }))}
                required
                className="form-input no-spinner"
              />
            </div>
          </div>
          <div className="flex flex-col">
            <label htmlFor="location" className="font-afacad mb-2.5 text-primary text-afacad-sm">
              Birth Location *
            </label>
            <div className="flex gap-2.5">
              <input
                type="text"
                id="location"
                placeholder="e.g., Seoul, New York, London, Tokyo..."
                value={formData.location}
                onChange={(e) => handleLocationInput(e.target.value)}
                required
                className="form-input flex-1"
              />
              <button
                type="button"
                onClick={handleAutoDetect}
                className="px-4 py-2 bg-primary text-white border-none rounded-[12px] cursor-pointer flex items-center justify-center transition-all duration-300 hover:opacity-90"
                aria-label="Use my location"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 1C5.24 1 3 3.24 3 6C3 9.5 8 15 8 15C8 15 13 9.5 13 6C13 3.24 10.76 1 8 1Z" stroke="currentColor" strokeWidth="0.8" fill="none"/>
                  <circle cx="8" cy="6" r="2" stroke="currentColor" strokeWidth="0.8" fill="none"/>
                </svg>
              </button>
            </div>
            {locationStatus && (
              <div className="mt-2 text-afacad-sm text-primary/70 font-afacad">
                {locationStatus === 'Searching...' ? (
                  <span className="searching-dots">
                    Searching
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                ) : (
                  locationStatus
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center mt-6 md:mt-8">
          <button 
            type="submit" 
            disabled={isLoading} 
            className="border border-primary text-primary px-6 py-3 rounded-design text-afacad-base font-afacad italic hover:bg-primary hover:text-white active:bg-primary active:text-white transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Calculating...' : 'See my result'}
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-design mt-5 shadow-[0_2px_10px_rgba(244,67,54,0.1)] text-afacad-base font-afacad">
          {error}
        </div>
      )}
    </div>
  );
};

export default CalculatorForm;

