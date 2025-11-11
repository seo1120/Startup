const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const moment = require('moment-timezone');
const axios = require('axios');
const geoTz = require('geo-tz');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const OpenAI = require('openai');

const app = express();
const port = 3000;

// 환경 변수 검증
if (!process.env.OPENAI_API_KEY) {
    console.error('WARNING: OPENAI_API_KEY is not set. AI features will not work.');
}

// Helmet으로 기본 보안 헤더 설정
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
        },
    },
    crossOriginEmbedderPolicy: false, // Vercel 호환성
}));

// CORS 설정
app.use((req, res, next) => {
    const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
    res.header('Access-Control-Allow-Origin', allowedOrigin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Rate Limiting - 일반 API
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15분
    max: 100, // 최대 100 요청
    message: { error: 'Too many requests from this IP, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', generalLimiter);

// Rate Limiting - AI 엔드포인트 (더 엄격)
const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1시간
    max: 20, // 최대 20 요청
    message: { error: 'Too many AI requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(express.json({ limit: '10mb' })); // JSON 페이로드 크기 제한

// 정적 파일 서빙 (로컬 개발용)
if (require.main === module) {
    app.use(express.static(__dirname));
}

// 루트 경로 처리 (Vercel용)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 입력 검증 함수
function validateDate(year, month, day, hour, minute) {
    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
        throw new Error('Invalid year. Must be between 1900 and 2100.');
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
        throw new Error('Invalid month. Must be between 1 and 12.');
    }
    if (!Number.isInteger(day) || day < 1 || day > 31) {
        throw new Error('Invalid day. Must be between 1 and 31.');
    }
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
        throw new Error('Invalid hour. Must be between 0 and 23.');
    }
    if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
        throw new Error('Invalid minute. Must be between 0 and 59.');
    }
    return true;
}

function sanitizeInput(input, maxLength = 1000) {
    if (typeof input !== 'string') return '';
    // HTML 태그 제거 및 길이 제한
    return input.trim()
        .slice(0, maxLength)
        .replace(/[<>]/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '');
}

function validateTimezone(timezone) {
    if (!timezone || typeof timezone !== 'string') {
        return false;
    }
    // 기본적인 timezone 형식 검증 (예: Asia/Seoul, America/New_York)
    const timezonePattern = /^[A-Za-z_]+\/[A-Za-z_]+$/;
    return timezonePattern.test(timezone) || timezone === 'UTC';
}

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
        
        if (!location || typeof location !== 'string') {
            return res.status(400).json({ error: 'Location is required' });
        }
        
        const sanitizedLocation = sanitizeInput(location, 200);
        if (sanitizedLocation.length < 2) {
            return res.status(400).json({ error: 'Location must be at least 2 characters long' });
        }
        
        console.log('Geocoding request received'); // 민감 정보 제거
        
        // OpenStreetMap Nominatim API 직접 호출
        const nominatimUrl = `https://nominatim.openstreetmap.org/search`;
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
    let db;
    try {
        const { year, month, day, hour, minute, gender, timezone, birthplace } = req.body;
        
        // 입력 검증
        try {
            validateDate(year, month, day, hour, minute);
        } catch (validationError) {
            return res.status(400).json({ error: validationError.message });
        }
        
        if (!['male', 'female'].includes(gender)) {
            return res.status(400).json({ error: 'Invalid gender. Must be "male" or "female".' });
        }
        
        if (!validateTimezone(timezone)) {
            return res.status(400).json({ error: 'Invalid timezone format.' });
        }
        
        const sanitizedBirthplace = sanitizeInput(birthplace || 'Not provided', 200);
        
        // 로그에서 민감 정보 제거
        console.log('Saju calculation request received');
        
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
        
        // Vercel 환경에서 데이터베이스 파일 경로 처리
        const dbPath = path.join(__dirname, 'manseryuk.db');
        console.log('Database path:', dbPath);
        console.log('__dirname:', __dirname);
        console.log('Current working directory:', process.cwd());
        
        try {
            db = new Database(dbPath, { readonly: true });
            console.log('Database connected successfully');
        } catch (dbError) {
            console.error('Database connection error:', dbError);
            console.error('Error details:', {
                message: dbError.message,
                code: dbError.code,
                errno: dbError.errno
            });
            return res.status(500).json({ 
                error: '데이터베이스 연결 오류가 발생했습니다.', 
                details: process.env.NODE_ENV === 'production' ? 'Database connection failed' : dbError.message 
            });
        }
        
        // 날짜로 만세력 조회 (변환된 한국 시간 기준)
        const query = `
            SELECT * FROM calenda_data 
            WHERE cd_sy = ? AND cd_sm = ? AND cd_sd = ?
        `;
        
        let result;
        try {
            result = db.prepare(query).get(adjustedYear, adjustedMonth.toString(), adjustedDay.toString());
        } catch (queryError) {
            console.error('Query error:', queryError);
            db.close();
            return res.status(500).json({ 
                error: '데이터베이스 쿼리 오류가 발생했습니다.', 
                details: queryError.message 
            });
        }
        
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
        
        // 데이터베이스 닫기
        try {
            db.close();
        } catch (closeError) {
            console.error('Database close error:', closeError);
        }
        
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
                    birthplace: sanitizedBirthplace,
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
        console.error('Error stack:', error.stack);
        
        // 데이터베이스가 열려있으면 닫기
        if (typeof db !== 'undefined' && db) {
            try {
                db.close();
            } catch (closeError) {
                console.error('Database close error in catch:', closeError);
            }
        }
        
        res.status(500).json({ 
            error: '서버 오류가 발생했습니다.', 
            details: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message 
        });
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

// 계절별 인사 멘트 생성
function getSeasonalGreeting(month) {
    const monthNum = parseInt(month);
    const seasonMessages = {
        spring: { months: [3, 4, 5], message: "The gentle warmth of spring is filling the air, bringing new energy and fresh beginnings 🌸" },
        summer: { months: [6, 7, 8], message: "The vibrant energy of summer is at its peak, full of warmth and vitality ☀️" },
        autumn: { months: [9, 10, 11], message: "The deep energy of late autumn is settling in, and you can sense winter approaching in the air 🍂" },
        winter: { months: [12, 1, 2], message: "The quiet stillness of winter surrounds us, a time for reflection and inner warmth ❄️" }
    };
    
    let season = 'autumn';
    if (monthNum >= 3 && monthNum <= 5) season = 'spring';
    else if (monthNum >= 6 && monthNum <= 8) season = 'summer';
    else if (monthNum >= 9 && monthNum <= 11) season = 'autumn';
    else season = 'winter';
    
    return seasonMessages[season].message;
}

// 시간대별 인사
function getTimeGreeting(hour) {
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    if (hour >= 17 && hour < 21) return "Good evening";
    return "Good night";
}

// 사주 기둥 기본 설명 (고정)
function getPillarTypeDescription(type) {
    const descriptions = {
        'year': {
            title: 'Year Pillar (년주)',
            meaning: 'Represents your roots, ancestors, and early environment. It shows the foundation of your personality and the energy you inherited from your family lineage.',
            influence: 'This pillar influences your overall life direction and the legacy you carry forward.'
        },
        'month': {
            title: 'Month Pillar (월주)',
            meaning: 'Represents your social environment, career, and how you interact with the world. It shows your approach to work, relationships, and external achievements.',
            influence: 'This pillar influences your career path, social connections, and how you express yourself in society.'
        },
        'day': {
            title: 'Day Pillar (일주)',
            meaning: 'Represents your core self, your true nature, and your inner being. This is the most important pillar as it shows who you are at your essence.',
            influence: 'This pillar is your Day Master - it represents your authentic self and how you experience life from within.'
        },
        'hour': {
            title: 'Hour Pillar (시주)',
            meaning: 'Represents your inner thoughts, children, and your later years. It shows your private self, your hidden qualities, and your legacy.',
            influence: 'This pillar influences your inner world, your relationship with yourself, and how you nurture others.'
        }
    };
    
    return descriptions[type] || null;
}

// 사주 풀이 생성 함수
async function generateSajuAnalysis(sajuData) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY is not set');
    }
    
    // 계절별 인사 멘트
    const seasonalGreeting = getSeasonalGreeting(sajuData.solar.month);
    const timeGreeting = getTimeGreeting(parseInt(sajuData.input.original?.hour || 12));
    
    // 생년월일 정보
    const birthYear = sajuData.solar.year;
    const birthMonth = sajuData.solar.month;
    const birthDay = sajuData.solar.day;
    const birthHour = sajuData.input.original?.hour || 12;
    const birthMinute = sajuData.input.original?.minute || 0;
    const gender = sajuData.input.gender === 'male' ? 'male' : 'female';
    const birthplace = sajuData.input.birthplace;
    
    // 시간 포맷팅
    const hour12 = birthHour > 12 ? birthHour - 12 : (birthHour === 0 ? 12 : birthHour);
    const ampm = birthHour >= 12 ? 'PM' : 'AM';
    const timeString = `${hour12}:${String(birthMinute).padStart(2, '0')} ${ampm}`;
    
    // 인사 멘트 (고정)
    let greeting = `${seasonalGreeting}\n\n`;
    greeting += `This is a wonderful time to reflect on the past year and prepare your heart for what's ahead.\n\n`;
    greeting += `Let's explore the Saju of a ${gender} born on ${birthMonth}/${birthDay}/${birthYear} at ${timeString} in ${birthplace}.\n\n`;
    greeting += `Please note that this service is operated on a personal server, and any support is optional. The interpretation content is always provided equally, regardless of support.\n\n`;
    
    // 기둥 기본 설명 섹션 (고정)
    let pillarSection = `## 🌿 Step 1. The Basic Structure of Your Saju — The Meaning of Your Four Pillars\n\n`;
    pillarSection += `Saju is a structure where the energy of heaven (천간, stems) and earth (지지, branches) pair together to form four pillars (柱).\n\n`;
    pillarSection += `Your Saju is structured as follows:\n\n`;
    
    const pillarTypes = [
        { type: 'year', pillar: sajuData.pillars.year.hanja, korean: sajuData.pillars.year.korean },
        { type: 'month', pillar: sajuData.pillars.month.hanja, korean: sajuData.pillars.month.korean },
        { type: 'day', pillar: sajuData.pillars.day.hanja, korean: sajuData.pillars.day.korean },
        { type: 'hour', pillar: sajuData.pillars.hour.hanja, korean: sajuData.pillars.hour.korean }
    ];
    
    pillarTypes.forEach(({ type, pillar, korean }) => {
        const typeDesc = getPillarTypeDescription(type);
        if (typeDesc) {
            pillarSection += `### ${typeDesc.title}: ${pillar} (${korean})\n\n`;
            pillarSection += `${typeDesc.meaning}\n\n`;
            pillarSection += `${typeDesc.influence}\n\n`;
        }
    });
    
    // LLM으로 각 기둥의 개인별 해석 + 종합 평가 생성
    const sajuInfo = `
=== Four Pillars of Destiny (사주) ===

Birth Information:
- Solar Date: ${sajuData.solar.year}-${sajuData.solar.month}-${sajuData.solar.day}
- Lunar Date: ${sajuData.lunar.year}-${sajuData.lunar.month}-${sajuData.lunar.day}${sajuData.lunar.isLeapMonth ? ' (Leap Month)' : ''}
- Gender: ${sajuData.input.gender}
- Birthplace: ${sajuData.input.birthplace}

Four Pillars (사주):
- Year Pillar (년주): ${sajuData.pillars.year.hanja} (${sajuData.pillars.year.korean})
- Month Pillar (월주): ${sajuData.pillars.month.hanja} (${sajuData.pillars.month.korean})
- Day Pillar (일주): ${sajuData.pillars.day.hanja} (${sajuData.pillars.day.korean})
- Hour Pillar (시주): ${sajuData.pillars.hour.hanja} (${sajuData.pillars.hour.korean})

Five Elements Analysis (오행 분석):
- Wood (목): ${sajuData.fiveElements.elements.목}
- Fire (화): ${sajuData.fiveElements.elements.화}
- Earth (토): ${sajuData.fiveElements.elements.토}
- Metal (금): ${sajuData.fiveElements.elements.금}
- Water (수): ${sajuData.fiveElements.elements.수}

Day Master (일간): ${sajuData.fiveElements.dayMaster.stem} (${sajuData.fiveElements.dayMaster.element}, ${sajuData.fiveElements.dayMaster.strength === '강' ? 'Strong' : sajuData.fiveElements.dayMaster.strength === '중' ? 'Moderate' : 'Weak'})
Dominant Element: ${sajuData.fiveElements.dominant}
Missing Elements: ${sajuData.fiveElements.missing.length > 0 ? sajuData.fiveElements.missing.join(', ') : 'None'}
        `.trim();
    
    const analysisPrompt = `You are a wellness counselor who uses traditional Saju (Four Pillars of Destiny) as a tool for self-understanding and personal growth. Your approach is warm, empathetic, and focused on helping people understand themselves better.

Based on the following Saju information, provide a detailed interpretation:

${sajuInfo}

Please write in the following structure:

## Step 2. Personal Interpretation of Your Four Pillars

For each of the four pillars (Year, Month, Day, Hour), provide a personalized interpretation:
- **Year Pillar (${sajuData.pillars.year.hanja} ${sajuData.pillars.year.korean})**: Explain what this specific pillar means for this person personally, how it influences their roots and foundation.
- **Month Pillar (${sajuData.pillars.month.hanja} ${sajuData.pillars.month.korean})**: Explain what this specific pillar means for this person personally, how it influences their social life and career.
- **Day Pillar (${sajuData.pillars.day.hanja} ${sajuData.pillars.day.korean})**: Explain what this specific pillar means for this person personally, how it represents their core self.
- **Hour Pillar (${sajuData.pillars.hour.hanja} ${sajuData.pillars.hour.korean})**: Explain what this specific pillar means for this person personally, how it influences their inner world.

## Step 3. Overall Assessment

After explaining each pillar, provide a comprehensive overall assessment focusing on:

1. **Who You Are**: Describe their natural personality, energy patterns, and inner nature based on their Four Pillars. Be specific and personal, like "You are someone who..." or "Your nature tends to..."

2. **Your Natural Strengths**: Highlight their inherent gifts and talents. Frame it as self-discovery, not fortune-telling.

3. **Areas for Growth**: Gently mention areas where they might find balance or growth, framed as opportunities for wellness.

4. **Energy Patterns**: Explain how their Five Elements balance affects their daily energy, emotions, and well-being.

5. **Wellness Recommendations**: Suggest lifestyle, self-care, or mindfulness practices that align with their natural energy patterns.

6. **Understanding Your Flow**: Help them understand their natural rhythms and how to work with them, not against them.

Write as if you're speaking directly to the person, using "you" and a warm, understanding tone. Write in a warm, conversational tone. Avoid fortune-telling language. Instead, focus on self-awareness, personal growth, and wellness. Use English, and make it feel like a personal counseling session. The total length should be about 600-800 words.`;
    
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You are a warm, empathetic wellness counselor who uses traditional Saju (Four Pillars of Destiny) as a tool for self-understanding and personal growth. You help people understand themselves better through understanding their natural energy patterns. Your approach is supportive, non-judgmental, and focused on wellness and self-awareness rather than fortune-telling.'
                },
                {
                    role: 'user',
                    content: analysisPrompt
                }
            ],
            temperature: 0.7,
            max_tokens: 2000
        });
        
        const llmInterpretation = response.choices[0].message.content;
        
        // 최종 결과 조합
        let finalAnalysis = greeting;
        finalAnalysis += pillarSection;
        finalAnalysis += llmInterpretation;
        finalAnalysis += `\n\n---\n\n`;
        finalAnalysis += `If you have more detailed questions or want to explore specific aspects of your Saju, please feel free to ask in the chat below. I'm here to help you understand yourself better. 💚`;
        
        return finalAnalysis;
    } catch (error) {
        console.error('Saju analysis generation error:', error);
        throw error;
    }
}

// 사주 풀이 생성 API
app.post('/api/analyze', aiLimiter, async (req, res) => {
    try {
        const { sajuData } = req.body;
        
        if (!sajuData || typeof sajuData !== 'object') {
            return res.status(400).json({ error: 'Saju data is required. Please calculate your Saju first.' });
        }
        
        // 필수 필드 검증
        if (!sajuData.pillars || !sajuData.solar || !sajuData.fiveElements) {
            return res.status(400).json({ error: 'Invalid saju data format.' });
        }
        
        console.log('Saju analysis request received');
        
        try {
            const analysis = await generateSajuAnalysis(sajuData);
            
            res.json({
                success: true,
                analysis: analysis
            });
        } catch (error) {
            console.error('Analysis generation error:', error);
            res.status(500).json({
                error: '사주 풀이 생성 중 오류가 발생했습니다.',
                message: error.message
            });
        }
    } catch (error) {
        console.error('Analyze API error:', error);
        res.status(500).json({
            error: '서버 오류가 발생했습니다.',
            message: error.message
        });
    }
});

// AI Chat API - 사주 상담
app.post('/api/chat', aiLimiter, async (req, res) => {
    try {
        const { question, sajuData, sajuAnalysis } = req.body;
        
        // 입력 검증
        if (!question || typeof question !== 'string') {
            return res.status(400).json({ error: 'Question is required.' });
        }
        
        const sanitizedQuestion = sanitizeInput(question, 2000);
        if (sanitizedQuestion.length === 0) {
            return res.status(400).json({ error: 'Question cannot be empty.' });
        }
        
        if (!sajuData || typeof sajuData !== 'object') {
            return res.status(400).json({ error: 'Saju data is required. Please calculate your Saju first.' });
        }
        
        // 필수 필드 검증
        if (!sajuData.pillars || !sajuData.solar || !sajuData.fiveElements) {
            return res.status(400).json({ error: 'Invalid saju data format.' });
        }
        
        // OpenAI 초기화
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.error('OPENAI_API_KEY environment variable is not set');
            return res.status(500).json({ 
                error: 'AI service is not configured.',
                message: 'Please configure OPENAI_API_KEY environment variable.'
            });
        }
        
        const openai = new OpenAI({ 
            apiKey: apiKey,
            timeout: 30000, // 30초 타임아웃
            maxRetries: 2
        });
        
        // 간단한 사주 요약만 포함 (긴 설명 제거)
        const briefSajuSummary = `Pillars: ${sajuData.pillars.year.hanja} ${sajuData.pillars.month.hanja} ${sajuData.pillars.day.hanja} ${sajuData.pillars.hour.hanja}. Day Master: ${sajuData.fiveElements.dayMaster.stem} (${sajuData.fiveElements.dayMaster.element}, ${sajuData.fiveElements.dayMaster.strength === '강' ? 'Strong' : sajuData.fiveElements.dayMaster.strength === '중' ? 'Moderate' : 'Weak'}). Elements: ${Object.entries(sajuData.fiveElements.elements).map(([k, v]) => `${k}:${v}`).join(', ')}.`;

        console.log('Chat request received:', { question, hasSajuData: !!sajuData, hasAnalysis: !!sajuAnalysis });
        
        // Set headers for streaming response
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        // OpenAI GPT 모델 사용 - 스트리밍으로 변경
        try {
            const stream = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `You are a Saju consultant. Answer in EXACTLY 1-2 sentences. Maximum 30 words. NO lists, NO examples, NO explanations. Just answer directly. Saju: ${briefSajuSummary}`
                    },
                    {
                        role: 'user',
                        content: sanitizedQuestion
                    }
                ],
                stream: true,
                temperature: 0.1,
                max_tokens: 20,   // ✨ 극도로 강력한 하드 제한
                presence_penalty: 4, // ✨ 새 내용 늘리지 않게
                frequency_penalty: 4, // ✨ 반복 억제
                stop: ['\n', '\n\n', '###', '##', '#', '**', '*', '1.', '2.', '3.', '4.', '5.', '-', '•', '|', ':', ';', '(', '['] // ✨ 강제 중단
            });
            
            let fullText = '';
            const maxSentences = 2;
            let sentenceEndCount = 0;
            let lastChunk = '';
            
            // 스트리밍 응답을 클라이언트로 전송
            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    fullText += content;
                    lastChunk = content;
                    
                    // 실시간으로 문장 종료 문자 체크 (. ! ?)
                    const sentenceEndings = (fullText.match(/[.!?]+/g) || []).length;
                    
                    // 2문장이 완성되면 즉시 중단
                    if (sentenceEndings >= maxSentences) {
                        // 두 번째 문장 종료 문자 위치 찾기
                        let count = 0;
                        let cutIndex = -1;
                        for (let i = 0; i < fullText.length; i++) {
                            if (/[.!?]/.test(fullText[i])) {
                                count++;
                                if (count === maxSentences) {
                                    cutIndex = i + 1;
                                    break;
                                }
                            }
                        }
                        
                        if (cutIndex > 0) {
                            fullText = fullText.substring(0, cutIndex).trim();
                        }
                        
                        // 완료 신호 전송하고 즉시 종료
                        res.write(`data: ${JSON.stringify({ chunk: '', done: true, fullText: fullText })}\n\n`);
                        res.end();
                        console.log('Response truncated at 2 sentences');
                        return;
                    }
                    
                    // 단어 수 체크 (30단어 초과 시 중단)
                    const wordCount = fullText.trim().split(/\s+/).length;
                    if (wordCount > 30) {
                        // 30단어까지만 유지
                        const words = fullText.trim().split(/\s+/).slice(0, 30);
                        fullText = words.join(' ');
                        // 마지막 문장이 완성되지 않았으면 제거
                        if (!/[.!?]/.test(fullText)) {
                            const lastSentenceEnd = fullText.lastIndexOf(/[.!?]/.exec(fullText) || '.');
                            if (lastSentenceEnd > 0) {
                                fullText = fullText.substring(0, lastSentenceEnd + 1);
                            }
                        }
                        res.write(`data: ${JSON.stringify({ chunk: '', done: true, fullText: fullText })}\n\n`);
                        res.end();
                        console.log('Response truncated at 30 words');
                        return;
                    }
                    
                    // 각 청크를 클라이언트로 전송
                    res.write(`data: ${JSON.stringify({ chunk: content, done: false })}\n\n`);
                }
            }
            
            // 최종 응답 강제 제한 (2문장 + 30단어)
            const sentenceEndings = (fullText.match(/[.!?]/g) || []).length;
            if (sentenceEndings > maxSentences) {
                // 마지막 문장 종료 문자 찾기
                let count = 0;
                let cutIndex = -1;
                for (let i = 0; i < fullText.length; i++) {
                    if (/[.!?]/.test(fullText[i])) {
                        count++;
                        if (count === maxSentences) {
                            cutIndex = i + 1;
                            break;
                        }
                    }
                }
                if (cutIndex > 0) {
                    fullText = fullText.substring(0, cutIndex).trim();
                }
            }
            
            // 단어 수도 체크 (30단어 초과 시 자르기)
            const wordCount = fullText.trim().split(/\s+/).length;
            if (wordCount > 30) {
                const words = fullText.trim().split(/\s+/).slice(0, 30);
                fullText = words.join(' ');
                // 마지막 문장이 완성되지 않았으면 제거
                if (!/[.!?]/.test(fullText)) {
                    const lastSentenceEnd = fullText.lastIndexOf(/[.!?]/.exec(fullText) || '.');
                    if (lastSentenceEnd > 0) {
                        fullText = fullText.substring(0, lastSentenceEnd + 1);
                    }
                }
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

