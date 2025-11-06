import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import moment from 'moment-timezone';
import { getHourBranch, getHourStem, analyzeFiveElements } from '@/lib/saju-utils';
import { STEM_KO, BRANCH_KO, WEEKDAY_HANJA_TO_ENGLISH, ELEMENT_HANJA_TO_ENGLISH, STAR28_TO_ENGLISH, ZODIAC_TO_ENGLISH } from '@/lib/translations';
import path from 'path';

export async function POST(request) {
    try {
        const { year, month, day, hour, minute, gender, timezone, birthplace } = await request.json();
        
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
        
        const dbPath = path.join(process.cwd(), 'manseryuk.db');
        const db = new Database(dbPath, { readonly: true });
        
        // 날짜로 만세력 조회 (변환된 한국 시간 기준)
        const query = `
            SELECT * FROM calenda_data 
            WHERE cd_sy = ? AND cd_sm = ? AND cd_sd = ?
        `;
        
        const result = db.prepare(query).get(adjustedYear, adjustedMonth.toString(), adjustedDay.toString());
        
        if (!result) {
            db.close();
            return NextResponse.json(
                { error: '해당 날짜의 데이터를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }
        
        // 시주 계산 (변환된 한국 시간 기준)
        const hourBranch = getHourBranch(adjustedHour);
        const dayStemChar = result.cd_hdganjee.charAt(0);
        const hourStem = getHourStem(dayStemChar, hourBranch);
        const hourPillar = hourStem + hourBranch;
        
        // 시주 한글명
        const hourPillarKo = STEM_KO[hourStem] + BRANCH_KO[hourBranch];
        
        // 요일 영어 변환
        const weekdayHanja = result.cd_hweek;
        const weekdayEnglish = WEEKDAY_HANJA_TO_ENGLISH[weekdayHanja] || weekdayHanja;
        const elementEnglish = ELEMENT_HANJA_TO_ENGLISH[weekdayHanja] || '';
        const weekdayDisplay = elementEnglish ? `${weekdayEnglish} (${elementEnglish})` : weekdayEnglish;
        
        // 28수 영어 변환
        const star28English = STAR28_TO_ENGLISH[result.cd_stars] || result.cd_stars;
        
        // 띠 영어 변환
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
        
        return NextResponse.json({
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
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.', details: error.message },
            { status: 500 }
        );
    }
}

