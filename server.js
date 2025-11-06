const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const moment = require('moment-timezone');
const axios = require('axios');
const geoTz = require('geo-tz');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = 3000;

app.use(express.json());

// 정적 파일 서빙 (로컬 개발용)
if (require.main === module) {
    app.use(express.static(__dirname));
}

// 루트 경로 처리 (Vercel용)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 시주 천간 계산 함수
function getHourStem(dayStem, hourBranch) {
    const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    
    const dayStemIndex = STEMS.indexOf(dayStem);
    const hourBranchIndex = BRANCHES.indexOf(hourBranch);
    
    // 일간에 따른 시간 천간 계산 공식
    const hourStemIndex = ((dayStemIndex % 5) * 2 + hourBranchIndex) % 10;
    return STEMS[hourStemIndex];
}

// 시간으로 시지 구하기
function getHourBranch(hour) {
    const HOUR_BRANCHES = [
        { start: 23, end: 1, branch: '子' },
        { start: 1, end: 3, branch: '丑' },
        { start: 3, end: 5, branch: '寅' },
        { start: 5, end: 7, branch: '卯' },
        { start: 7, end: 9, branch: '辰' },
        { start: 9, end: 11, branch: '巳' },
        { start: 11, end: 13, branch: '午' },
        { start: 13, end: 15, branch: '未' },
        { start: 15, end: 17, branch: '申' },
        { start: 17, end: 19, branch: '酉' },
        { start: 19, end: 21, branch: '戌' },
        { start: 21, end: 23, branch: '亥' }
    ];
    
    for (let hb of HOUR_BRANCHES) {
        if (hb.start === 23) {
            if (hour >= 23 || hour < 1) return hb.branch;
        } else {
            if (hour >= hb.start && hour < hb.end) return hb.branch;
        }
    }
    return '子';
}

// Geocoding API - 도시명으로 timezone 찾기
app.post('/api/geocode', async (req, res) => {
    try {
        const { location } = req.body;
        
        if (!location) {
            return res.status(400).json({ error: 'Location is required' });
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
            return res.status(404).json({ 
                error: 'Location not found',
                message: 'Could not find the specified location. Please try a different search term.'
            });
        }
        
        const result = response.data[0];
        const latitude = parseFloat(result.lat);
        const longitude = parseFloat(result.lon);
        const address = result.address || {};
        
        // 위도/경도 → timezone
        const timezones = geoTz.find(latitude, longitude);
        const timezone = timezones && timezones.length > 0 ? timezones[0] : null;
        
        if (!timezone) {
            return res.status(404).json({ 
                error: 'Timezone not found',
                message: 'Could not determine timezone for this location.'
            });
        }
        
        console.log('Found:', { location, timezone, coordinates: { latitude, longitude } });
        
        res.json({
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
        res.status(500).json({ 
            error: 'Geocoding failed',
            message: error.message 
        });
    }
});

// 만세력 조회 API
app.post('/api/manseryeok', (req, res) => {
    try {
        const { year, month, day, hour, minute, gender, timezone, birthplace } = req.body;
        
        // 디버깅용 로그
        console.log('받은 데이터:', { year, month, day, hour, minute, gender, timezone, birthplace });
        
        // Timezone 변환: 입력받은 현지 시간 → 한국 표준시(KST)로 변환
        // 만세력 DB는 한국 시간 기준이므로 Asia/Seoul로 변환
        const localTimeString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        
        // 사용자의 timezone에서 moment 객체 생성
        const localMoment = moment.tz(localTimeString, timezone);
        
        // 한국 시간(KST)으로 변환
        const kstMoment = localMoment.clone().tz('Asia/Seoul');
        
        // 변환된 한국 시간으로 만세력 조회
        const adjustedYear = kstMoment.year();
        const adjustedMonth = kstMoment.month() + 1; // moment는 0-11, 우리는 1-12
        const adjustedDay = kstMoment.date();
        const adjustedHour = kstMoment.hour();
        const adjustedMinute = kstMoment.minute();
        
        console.log('원본 시간:', localTimeString, timezone);
        console.log('변환된 한국 시간:', kstMoment.format('YYYY-MM-DD HH:mm'));
        
        const db = new Database('manseryuk.db', { readonly: true });
        
        // 날짜로 만세력 조회 (변환된 한국 시간 기준)
        const query = `
            SELECT * FROM calenda_data 
            WHERE cd_sy = ? AND cd_sm = ? AND cd_sd = ?
        `;
        
        const result = db.prepare(query).get(adjustedYear, adjustedMonth.toString(), adjustedDay.toString());
        
        if (!result) {
            db.close();
            return res.status(404).json({ error: '해당 날짜의 데이터를 찾을 수 없습니다.' });
        }
        
        // 시주 계산 (변환된 한국 시간 기준)
        const hourBranch = getHourBranch(adjustedHour);
        const dayStemChar = result.cd_hdganjee.charAt(0);
        const hourStem = getHourStem(dayStemChar, hourBranch);
        const hourPillar = hourStem + hourBranch;
        
        // 시주 한글명
        const STEM_KO = {
            '甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무',
            '己': '기', '庚': '경', '辛': '신', '壬': '임', '癸': '계'
        };
        const BRANCH_KO = {
            '子': '자', '丑': '축', '寅': '인', '卯': '묘', '辰': '진', '巳': '사',
            '午': '오', '未': '미', '申': '신', '酉': '유', '戌': '술', '亥': '해'
        };
        const hourPillarKo = STEM_KO[hourStem] + BRANCH_KO[hourBranch];
        
        // 요일 영어 변환
        const WEEKDAY_HANJA_TO_ENGLISH = {
            '日': 'Sunday', '月': 'Monday', '火': 'Tuesday', 
            '水': 'Wednesday', '木': 'Thursday', '金': 'Friday', '土': 'Saturday'
        };
        const ELEMENT_HANJA_TO_ENGLISH = {
            '日': 'Sun', '月': 'Moon', '火': 'Fire', 
            '水': 'Water', '木': 'Wood', '金': 'Metal', '土': 'Earth'
        };
        const weekdayHanja = result.cd_hweek;
        const weekdayEnglish = WEEKDAY_HANJA_TO_ENGLISH[weekdayHanja] || weekdayHanja;
        const elementEnglish = ELEMENT_HANJA_TO_ENGLISH[weekdayHanja] || '';
        const weekdayDisplay = elementEnglish ? `${weekdayEnglish} (${elementEnglish})` : weekdayEnglish;
        
        // 28수 영어 변환
        const STAR28_TO_ENGLISH = {
            '角': 'Horn', '亢': 'Neck', '氐': 'Root', '房': 'Chamber', 
            '心': 'Heart', '尾': 'Tail', '箕': 'Winnowing Basket',
            '斗': 'Dipper', '牛': 'Ox', '女': 'Girl', '虛': 'Emptiness', 
            '危': 'Rooftop', '室': 'Encampment', '壁': 'Wall',
            '奎': 'Legs', '婁': 'Bond', '胃': 'Stomach', '昴': 'Hairy Head', 
            '畢': 'Net', '觜': 'Turtle Beak', '參': 'Three Stars',
            '井': 'Well', '鬼': 'Ghost', '柳': 'Willow', '星': 'Star', 
            '張': 'Extended Net', '翼': 'Wing', '軫': 'Chariot'
        };
        const star28English = STAR28_TO_ENGLISH[result.cd_stars] || result.cd_stars;
        
        // 띠 영어 변환
        const ZODIAC_TO_ENGLISH = {
            '쥐': 'Rat', '소': 'Ox', '호랑이': 'Tiger', '토끼': 'Rabbit',
            '용': 'Dragon', '뱀': 'Snake', '말': 'Horse', '양': 'Goat',
            '원숭이': 'Monkey', '닭': 'Rooster', '개': 'Dog', '돼지': 'Pig'
        };
        const zodiacEnglish = ZODIAC_TO_ENGLISH[result.cd_ddi] || result.cd_ddi;
        
        // 오행 분석
        const pillars = {
            year: result.cd_hyganjee,
            month: result.cd_hmganjee,
            day: result.cd_hdganjee,
            hour: hourPillar
        };
        
        const fiveElements = analyzeFiveElements(pillars);
        
        db.close();
        
        res.json({
            success: true,
            data: {
                solar: {
                    year: result.cd_sy,
                    month: result.cd_sm,
                    day: result.cd_sd
                },
                lunar: {
                    year: result.cd_ly,
                    month: result.cd_lm,
                    day: result.cd_ld,
                    isLeapMonth: result.cd_leap_month === 1
                },
                pillars: {
                    year: {
                        hanja: result.cd_hyganjee,
                        korean: result.cd_kyganjee
                    },
                    month: {
                        hanja: result.cd_hmganjee,
                        korean: result.cd_kmganjee
                    },
                    day: {
                        hanja: result.cd_hdganjee,
                        korean: result.cd_kdganjee
                    },
                    hour: {
                        hanja: hourPillar,
                        korean: hourPillarKo
                    }
                },
                additional: {
                    weekday: {
                        hanja: result.cd_hweek,
                        korean: weekdayDisplay
                    },
                    star28: star28English,
                    zodiac: zodiacEnglish,
                    moonState: result.cd_moon_state,
                    solarTerm: result.cd_kterms,
                    holiday: result.holiday === 1
                },
                fiveElements: fiveElements,
                input: {
                    gender: gender,
                    birthplace: birthplace,
                    timezone: timezone,
                    original: {
                        year: year,
                        month: month,
                        day: day,
                        hour: hour,
                        minute: minute,
                        timeString: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
                        dateString: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
                    },
                    adjusted: {
                        year: adjustedYear,
                        month: adjustedMonth,
                        day: adjustedDay,
                        hour: adjustedHour,
                        minute: adjustedMinute,
                        timeString: `${adjustedHour.toString().padStart(2, '0')}:${adjustedMinute.toString().padStart(2, '0')}`,
                        dateString: `${adjustedYear}-${adjustedMonth.toString().padStart(2, '0')}-${adjustedDay.toString().padStart(2, '0')}`
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: '서버 오류가 발생했습니다.', details: error.message });
    }
});

// 오행 분석 함수
function analyzeFiveElements(pillars) {
    const ELEMENT_MAP = {
        '甲': '목', '乙': '목',
        '丙': '화', '丁': '화',
        '戊': '토', '己': '토',
        '庚': '금', '辛': '금',
        '壬': '수', '癸': '수',
        '子': '수', '亥': '수',
        '寅': '목', '卯': '목',
        '巳': '화', '午': '화',
        '申': '금', '酉': '금',
        '丑': '토', '辰': '토', '未': '토', '戌': '토'
    };
    
    const elements = { '목': 0, '화': 0, '토': 0, '금': 0, '수': 0 };
    
    // 천간(줄기) 분석
    Object.values(pillars).forEach(pillar => {
        const stem = pillar.charAt(0);
        const branch = pillar.charAt(1);
        
        if (ELEMENT_MAP[stem]) elements[ELEMENT_MAP[stem]]++;
        if (ELEMENT_MAP[branch]) elements[ELEMENT_MAP[branch]]++;
    });
    
    // 일간 (Day Master) 오행
    const dayMaster = pillars.day.charAt(0);
    const dayMasterElement = ELEMENT_MAP[dayMaster];
    
    // 강약 판단 (간단한 로직)
    const dayMasterCount = elements[dayMasterElement];
    const strength = dayMasterCount >= 3 ? '강' : dayMasterCount === 2 ? '중' : '약';
    
    return {
        elements: elements,
        dayMaster: {
            stem: dayMaster,
            element: dayMasterElement,
            strength: strength
        },
        missing: Object.entries(elements)
            .filter(([_, count]) => count === 0)
            .map(([el, _]) => el),
        dominant: Object.entries(elements)
            .sort((a, b) => b[1] - a[1])[0][0]
    };
}

// AI Chat API - 사주 상담
app.post('/api/chat', async (req, res) => {
    try {
        const { question, pillars } = req.body;
        
        if (!question) {
            return res.status(400).json({ error: '질문이 필요합니다.' });
        }
        
        if (!pillars) {
            return res.status(400).json({ error: '사주 정보가 필요합니다. 먼저 사주를 계산해주세요.' });
        }
        
        // Google Generative AI 초기화
        const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('GOOGLE_API_KEY or GEMINI_API_KEY environment variable is not set');
            return res.status(500).json({ 
                error: 'AI 서비스가 설정되지 않았습니다.',
                message: 'GOOGLE_API_KEY 또는 GEMINI_API_KEY 환경 변수를 설정해주세요.'
            });
        }
        
        const genAI = new GoogleGenerativeAI(apiKey);
        
        // 사주 정보를 텍스트로 변환
        const sajuInfo = `
Saju Information:
- Year Pillar: ${pillars.year_pillar || 'N/A'}
- Month Pillar: ${pillars.month_pillar || 'N/A'}
- Day Pillar: ${pillars.day_pillar || 'N/A'}
- Hour Pillar: ${pillars.hour_pillar || 'N/A'}
- Five Elements: 
  * Wood: ${pillars.five_elements?.wood || 0}
  * Fire: ${pillars.five_elements?.fire || 0}
  * Earth: ${pillars.five_elements?.earth || 0}
  * Metal: ${pillars.five_elements?.metal || 0}
  * Water: ${pillars.five_elements?.water || 0}
        `.trim();
        
        // 프롬프트 구성
        const prompt = `You are a traditional Saju expert. Please provide consultation based on the user's Saju information.

${sajuInfo}

User's Question: ${question}

Response Guidelines:
1. Keep your response concise, within 5-8 lines.
2. Use tables (markdown table format) only when it's appropriate and natural for the question. Don't force tables if they're not suitable for the question.
3. When using tables, include rankings and reasons for each item.
4. Add a summary paragraph at the end.
5. Use simple language and avoid overly complex explanations.
6. Provide specific examples when possible.

Based on the Saju information above, please answer the user's question in a friendly and accurate manner. Please respond in English. Provide practical and helpful advice based on Saju interpretation.`;

        console.log('Chat request received:', { question, pillars });
        
        // Set headers for streaming response
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        // gemini-2.5-flash 모델 사용 - 스트리밍으로 변경
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        
        try {
            const result = await model.generateContentStream(prompt);
            let fullText = '';
            
            // 스트리밍 응답을 클라이언트로 전송
            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                fullText += chunkText;
                // 각 청크를 클라이언트로 전송
                res.write(`data: ${JSON.stringify({ chunk: chunkText, done: false })}\n\n`);
            }
            
            // 완료 신호 전송
            res.write(`data: ${JSON.stringify({ chunk: '', done: true, fullText: fullText })}\n\n`);
            res.end();
            
            console.log('AI response streamed successfully');
        } catch (streamError) {
            res.write(`data: ${JSON.stringify({ error: streamError.message, done: true })}\n\n`);
            res.end();
        }
        
    } catch (error) {
        console.error('Chat API error:', error);
        // 스트리밍 응답이 시작되지 않았을 경우에만 일반 JSON 응답
        if (!res.headersSent) {
            res.status(500).json({ 
                error: 'AI consultation service error occurred.',
                message: error.message 
            });
        } else {
            // 이미 스트리밍이 시작되었으면 에러를 스트리밍으로 전송
            res.write(`data: ${JSON.stringify({ error: error.message, done: true })}\n\n`);
            res.end();
        }
    }
});

// Vercel serverless function export
module.exports = app;

// Local development server
if (require.main === module) {
    app.listen(port, () => {
        console.log(`Five Flows server is running at http://localhost:${port}`);
    });
}

