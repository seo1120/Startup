import { NextResponse } from 'next/server';
import axios from 'axios';
import geoTz from 'geo-tz';

export async function POST(request) {
    try {
        const { location } = await request.json();
        
        if (!location) {
            return NextResponse.json(
                { error: 'Location is required' },
                { status: 400 }
            );
        }
        
        console.log('Geocoding request for:', location);
        
        // OpenStreetMap Nominatim API 직접 호출
        const nominatimUrl = `https://nominatim.openstreetmap.org/search`;
        const response = await axios.get(nominatimUrl, {
            params: {
                q: location,
                format: 'json',
                limit: 1,
                addressdetails: 1
            },
            headers: {
                'User-Agent': 'FiveFlows-Saju-App/1.0',
                'Accept-Language': 'en'
            }
        });
        
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
        
        // 위도/경도 → timezone
        const timezones = geoTz.find(latitude, longitude);
        const timezone = timezones && timezones.length > 0 ? timezones[0] : null;
        
        if (!timezone) {
            return NextResponse.json(
                { 
                    error: 'Timezone not found',
                    message: 'Could not determine timezone for this location.'
                },
                { status: 404 }
            );
        }
        
        console.log('Found:', { location, timezone, coordinates: { latitude, longitude } });
        
        return NextResponse.json({
            success: true,
            data: {
                timezone: timezone,
                location: result.display_name || location,
                city: address.city || address.town || address.village || address.municipality,
                country: address.country,
                countryCode: address.country_code,
                coordinates: {
                    latitude: latitude,
                    longitude: longitude
                }
            }
        });
        
    } catch (error) {
        console.error('Geocoding error:', error);
        return NextResponse.json(
            { 
                error: 'Geocoding failed',
                message: error.message 
            },
            { status: 500 }
        );
    }
}

