import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { location } = body;
    
    console.log('Geocode request received:', { location: location?.substring(0, 50) });
    
    if (!location || typeof location !== 'string') {
      return NextResponse.json(
        { error: 'Location is required' },
        { status: 400 }
      );
    }
    
    const sanitizedLocation = location.trim().slice(0, 200);
    if (sanitizedLocation.length < 2) {
      return NextResponse.json(
        { error: 'Location must be at least 2 characters long' },
        { status: 400 }
      );
    }
    
    // OpenStreetMap Nominatim API
    const nominatimUrl = `https://nominatim.openstreetmap.org/search`;
    console.log('Calling Nominatim API for:', sanitizedLocation);
    
    const response = await axios.get(nominatimUrl, {
      params: {
        q: sanitizedLocation,
        format: 'json',
        limit: 1,
        addressdetails: 1
      },
      headers: {
        'User-Agent': 'FiveFlows-Saju-App/1.0',
        'Accept-Language': 'en'
      }
    });
    
    console.log('Nominatim API response:', response.data?.length || 0, 'results');
    
    if (!response.data || response.data.length === 0) {
      return NextResponse.json(
        { 
          error: 'Location not found',
          message: 'Could not find the specified location. Please try a different search term.'
        },
        { status: 404 }
      );
    }
    
    const result = response.data[0];
    const latitude = parseFloat(result.lat);
    const longitude = parseFloat(result.lon);
    const address = result.address || {};
    
    console.log('Found location:', { latitude, longitude, address: address.city || address.town });
    
    // 위도/경도 → timezone (도시/국가 매핑 사용)
    const countryCode = address.country_code?.toUpperCase();
    const cityName = (address.city || address.town || address.village || address.municipality || '').toLowerCase();
    let timezone: string | null = null;
    
    // 주요 도시 타임존 매핑
    const cityTimezoneMap: { [key: string]: string } = {
      'seoul': 'Asia/Seoul',
      'tokyo': 'Asia/Tokyo',
      'beijing': 'Asia/Shanghai',
      'shanghai': 'Asia/Shanghai',
      'hong kong': 'Asia/Hong_Kong',
      'singapore': 'Asia/Singapore',
      'bangkok': 'Asia/Bangkok',
      'jakarta': 'Asia/Jakarta',
      'manila': 'Asia/Manila',
      'new york': 'America/New_York',
      'los angeles': 'America/Los_Angeles',
      'chicago': 'America/Chicago',
      'denver': 'America/Denver',
      'london': 'Europe/London',
      'paris': 'Europe/Paris',
      'berlin': 'Europe/Berlin',
      'rome': 'Europe/Rome',
      'madrid': 'Europe/Madrid',
      'moscow': 'Europe/Moscow',
      'sydney': 'Australia/Sydney',
      'melbourne': 'Australia/Melbourne',
      'auckland': 'Pacific/Auckland',
      'toronto': 'America/Toronto',
      'vancouver': 'America/Vancouver',
      'mexico city': 'America/Mexico_City',
      'sao paulo': 'America/Sao_Paulo',
      'buenos aires': 'America/Argentina/Buenos_Aires',
    };
      
    // 도시명으로 먼저 찾기
    if (cityName && cityTimezoneMap[cityName]) {
      timezone = cityTimezoneMap[cityName];
      console.log('Timezone found via city mapping:', timezone);
    } else {
      // 국가 코드 기반 기본 타임존 (간단한 매핑)
      const countryTimezoneMap: { [key: string]: string } = {
        'KR': 'Asia/Seoul',
        'JP': 'Asia/Tokyo',
        'CN': 'Asia/Shanghai',
        'US': 'America/New_York', // 기본값, 실제로는 위도로 더 정확하게 판단 가능
        'GB': 'Europe/London',
        'FR': 'Europe/Paris',
        'DE': 'Europe/Berlin',
        'IT': 'Europe/Rome',
        'ES': 'Europe/Madrid',
        'AU': 'Australia/Sydney',
        'NZ': 'Pacific/Auckland',
        'CA': 'America/Toronto',
        'BR': 'America/Sao_Paulo',
        'AR': 'America/Argentina/Buenos_Aires',
        'MX': 'America/Mexico_City',
      };
      
      if (countryCode && countryTimezoneMap[countryCode]) {
        timezone = countryTimezoneMap[countryCode];
        console.log('Timezone found via country mapping:', timezone);
      } else {
        // 위도 기반 기본 추정 (정확하지 않지만 작동)
        if (longitude >= -180 && longitude < -30) {
          // 아메리카
          if (latitude >= 0) timezone = 'America/New_York';
          else timezone = 'America/Sao_Paulo';
        } else if (longitude >= -30 && longitude < 40) {
          // 유럽/아프리카
          timezone = 'Europe/London';
        } else if (longitude >= 40 && longitude < 120) {
          // 아시아 (중동 포함)
          timezone = 'Asia/Shanghai';
        } else {
          // 동아시아/오세아니아
          timezone = 'Asia/Tokyo';
        }
        console.log('Timezone estimated via coordinates:', timezone);
      }
    }
    
    if (!timezone) {
      return NextResponse.json(
        { 
          error: 'Timezone not found',
          message: 'Could not determine timezone for this location.'
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        timezone: timezone,
        location: result.display_name || sanitizedLocation,
        city: address.city || address.town || address.village || address.municipality,
        country: address.country,
        countryCode: address.country_code,
        coordinates: {
          latitude: latitude,
          longitude: longitude
        }
      }
    });
    
  } catch (error: any) {
    console.error('Geocoding error:', error);
    
    // 더 자세한 에러 정보 제공
    let errorMessage = 'Geocoding failed';
    if (error.response) {
      // API 응답 에러
      errorMessage = `API error: ${error.response.status} ${error.response.statusText}`;
      console.error('API response error:', error.response.data);
    } else if (error.request) {
      // 요청은 보냈지만 응답이 없음
      errorMessage = 'No response from geocoding service. Please check your internet connection.';
      console.error('No response received:', error.request);
    } else {
      // 기타 에러
      errorMessage = error.message || 'Unknown error occurred';
    }
    
    return NextResponse.json(
      { 
        error: 'Geocoding failed',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

