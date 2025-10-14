const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(__dirname));

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

// 만세력 조회 API
app.post('/api/manseryeok', (req, res) => {
    try {
        const { year, month, day, hour, minute, gender, birthplace } = req.body;
        
        // 디버깅용 로그
        console.log('받은 데이터:', { year, month, day, hour, minute, gender, birthplace });
        
        const db = new Database('manseryuk.db', { readonly: true });
        
        // 날짜로 만세력 조회
        const query = `
            SELECT * FROM calenda_data 
            WHERE cd_sy = ? AND cd_sm = ? AND cd_sd = ?
        `;
        
        const result = db.prepare(query).get(year, month.toString(), day.toString());
        
        if (!result) {
            db.close();
            return res.status(404).json({ error: '해당 날짜의 데이터를 찾을 수 없습니다.' });
        }
        
        // 시주 계산
        const hourBranch = getHourBranch(hour);
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
                        korean: result.cd_kweek
                    },
                    star28: result.cd_stars,
                    zodiac: result.cd_ddi,
                    moonState: result.cd_moon_state,
                    solarTerm: result.cd_kterms,
                    holiday: result.holiday === 1
                },
                fiveElements: fiveElements,
                input: {
                    gender: gender,
                    birthplace: birthplace,
                    hour: hour || 12,
                    minute: minute || 0,
                    timeString: `${(hour || 12).toString().padStart(2, '0')}:${(minute || 0).toString().padStart(2, '0')}`
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

app.listen(port, () => {
    console.log(`만세력 서버가 http://localhost:${port} 에서 실행중입니다.`);
});

