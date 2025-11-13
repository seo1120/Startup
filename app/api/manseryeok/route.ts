import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import moment from 'moment-timezone';

// 입력 검증 함수
function validateDate(year: number, month: number, day: number, hour: number, minute: number) {
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

function validateTimezone(timezone: string) {
  if (!timezone || typeof timezone !== 'string') {
    return false;
  }
  const timezonePattern = /^[A-Za-z_]+\/[A-Za-z_]+$/;
  return timezonePattern.test(timezone) || timezone === 'UTC';
}

// 시주 천간 계산 함수
function getHourStem(dayStem: string, hourBranch: string) {
  const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  
  const dayStemIndex = STEMS.indexOf(dayStem);
  const hourBranchIndex = BRANCHES.indexOf(hourBranch);
  
  const hourStemIndex = ((dayStemIndex % 5) * 2 + hourBranchIndex) % 10;
  return STEMS[hourStemIndex];
}

// 시간으로 시지 구하기
function getHourBranch(hour: number) {
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

// 오행 분석 함수
function analyzeFiveElements(pillars: { year: string; month: string; day: string; hour: string }) {
  const ELEMENT_MAP: { [key: string]: string } = {
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
  
  const elements: { [key: string]: number } = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  
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

export async function POST(request: NextRequest) {
  let db: Database.Database | null = null;
  
  try {
    const body = await request.json();
    const { year, month, day, hour, minute, gender, timezone, birthplace } = body;
    
    // 입력 검증
    try {
      validateDate(year, month, day, hour, minute);
    } catch (validationError: any) {
      return NextResponse.json(
        { error: validationError.message },
        { status: 400 }
      );
    }
    
    if (!['male', 'female'].includes(gender)) {
      return NextResponse.json(
        { error: 'Invalid gender. Must be "male" or "female".' },
        { status: 400 }
      );
    }
    
    if (!validateTimezone(timezone)) {
      return NextResponse.json(
        { error: 'Invalid timezone format.' },
        { status: 400 }
      );
    }
    
    // Timezone 변환
    const localTimeString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    const localMoment = moment.tz(localTimeString, timezone);
    const kstMoment = localMoment.clone().tz('Asia/Seoul');
    
    const adjustedYear = kstMoment.year();
    const adjustedMonth = kstMoment.month() + 1;
    const adjustedDay = kstMoment.date();
    const adjustedHour = kstMoment.hour();
    const adjustedMinute = kstMoment.minute();
    
    // 데이터베이스 경로
    const dbPath = path.join(process.cwd(), 'manseryuk.db');
    
    try {
      db = new Database(dbPath, { readonly: true });
    } catch (dbError: any) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { 
          error: 'I apologize, but I encountered an issue while accessing the database. Please try again in a moment.'
        },
        { status: 500 }
      );
    }
    
    // 만세력 조회
    const query = `
      SELECT * FROM calenda_data 
      WHERE cd_sy = ? AND cd_sm = ? AND cd_sd = ?
    `;
    
    let result;
    try {
      result = db.prepare(query).get(adjustedYear, adjustedMonth.toString(), adjustedDay.toString());
    } catch (queryError: any) {
      console.error('Query error:', queryError);
      db.close();
      return NextResponse.json(
        { 
          error: 'I apologize, but I encountered an issue while processing your request. Please try again in a moment.'
        },
        { status: 500 }
      );
    }
    
    if (!result) {
      db.close();
      return NextResponse.json(
        { error: '해당 날짜의 데이터를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    // 시주 계산
    const hourBranch = getHourBranch(adjustedHour);
    const dayStemChar = (result as any).cd_hdganjee.charAt(0);
    const hourStem = getHourStem(dayStemChar, hourBranch);
    const hourPillar = hourStem + hourBranch;
    
    // 시주 한글명
    const STEM_KO: { [key: string]: string } = {
      '甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무',
      '己': '기', '庚': '경', '辛': '신', '壬': '임', '癸': '계'
    };
    const BRANCH_KO: { [key: string]: string } = {
      '子': '자', '丑': '축', '寅': '인', '卯': '묘', '辰': '진', '巳': '사',
      '午': '오', '未': '미', '申': '신', '酉': '유', '戌': '술', '亥': '해'
    };
    const hourPillarKo = STEM_KO[hourStem] + BRANCH_KO[hourBranch];
    
    // 요일 영어 변환
    const WEEKDAY_HANJA_TO_ENGLISH: { [key: string]: string } = {
      '日': 'Sunday', '月': 'Monday', '火': 'Tuesday', 
      '水': 'Wednesday', '木': 'Thursday', '金': 'Friday', '土': 'Saturday'
    };
    const ELEMENT_HANJA_TO_ENGLISH: { [key: string]: string } = {
      '日': 'Sun', '月': 'Moon', '火': 'Fire', 
      '水': 'Water', '木': 'Wood', '金': 'Metal', '土': 'Earth'
    };
    const weekdayHanja = (result as any).cd_hweek;
    const weekdayEnglish = WEEKDAY_HANJA_TO_ENGLISH[weekdayHanja] || weekdayHanja;
    const elementEnglish = ELEMENT_HANJA_TO_ENGLISH[weekdayHanja] || '';
    const weekdayDisplay = elementEnglish ? `${weekdayEnglish} (${elementEnglish})` : weekdayEnglish;
    
    // 28수 영어 변환
    const STAR28_TO_ENGLISH: { [key: string]: string } = {
      '角': 'Horn', '亢': 'Neck', '氐': 'Root', '房': 'Chamber', 
      '心': 'Heart', '尾': 'Tail', '箕': 'Winnowing Basket',
      '斗': 'Dipper', '牛': 'Ox', '女': 'Girl', '虛': 'Emptiness', 
      '危': 'Rooftop', '室': 'Encampment', '壁': 'Wall',
      '奎': 'Legs', '婁': 'Bond', '胃': 'Stomach', '昴': 'Hairy Head', 
      '畢': 'Net', '觜': 'Turtle Beak', '參': 'Three Stars',
      '井': 'Well', '鬼': 'Ghost', '柳': 'Willow', '星': 'Star', 
      '張': 'Extended Net', '翼': 'Wing', '軫': 'Chariot'
    };
    const star28English = STAR28_TO_ENGLISH[(result as any).cd_stars] || (result as any).cd_stars;
    
    // 띠 영어 변환
    const ZODIAC_TO_ENGLISH: { [key: string]: string } = {
      '쥐': 'Rat', '소': 'Ox', '호랑이': 'Tiger', '토끼': 'Rabbit',
      '용': 'Dragon', '뱀': 'Snake', '말': 'Horse', '양': 'Goat',
      '원숭이': 'Monkey', '닭': 'Rooster', '개': 'Dog', '돼지': 'Pig'
    };
    const zodiacEnglish = ZODIAC_TO_ENGLISH[(result as any).cd_ddi] || (result as any).cd_ddi;
    
    // 오행 분석
    const pillars = {
      year: (result as any).cd_hyganjee,
      month: (result as any).cd_hmganjee,
      day: (result as any).cd_hdganjee,
      hour: hourPillar
    };
    
    const fiveElements = analyzeFiveElements(pillars);
    
    // 데이터베이스 닫기
    try {
      db.close();
    } catch (closeError) {
      console.error('Database close error:', closeError);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        solar: {
          year: (result as any).cd_sy,
          month: (result as any).cd_sm,
          day: (result as any).cd_sd
        },
        lunar: {
          year: (result as any).cd_ly,
          month: (result as any).cd_lm,
          day: (result as any).cd_ld,
          isLeapMonth: (result as any).cd_leap_month === 1
        },
        pillars: {
          year: {
            hanja: (result as any).cd_hyganjee,
            korean: (result as any).cd_kyganjee
          },
          month: {
            hanja: (result as any).cd_hmganjee,
            korean: (result as any).cd_kmganjee
          },
          day: {
            hanja: (result as any).cd_hdganjee,
            korean: (result as any).cd_kdganjee
          },
          hour: {
            hanja: hourPillar,
            korean: hourPillarKo
          }
        },
        additional: {
          weekday: {
            hanja: (result as any).cd_hweek,
            korean: weekdayDisplay
          },
          star28: star28English,
          zodiac: zodiacEnglish,
          moonState: (result as any).cd_moon_state,
          solarTerm: (result as any).cd_kterms,
          holiday: (result as any).holiday === 1
        },
        fiveElements: fiveElements,
        input: {
          gender: gender,
          birthplace: birthplace || 'Not provided',
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
    
  } catch (error: any) {
    console.error('Error:', error);
    
    if (db) {
      try {
        db.close();
      } catch (closeError) {
        console.error('Database close error in catch:', closeError);
      }
    }
    
    return NextResponse.json(
      { 
        error: 'I apologize, but I encountered an issue. Please try again in a moment.'
      },
      { status: 500 }
    );
  }
}

