// 시주 천간 계산 함수
export function getHourStem(dayStem, hourBranch) {
    const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    
    const dayStemIndex = STEMS.indexOf(dayStem);
    const hourBranchIndex = BRANCHES.indexOf(hourBranch);
    
    // 일간에 따른 시간 천간 계산 공식
    const hourStemIndex = ((dayStemIndex % 5) * 2 + hourBranchIndex) % 10;
    return STEMS[hourStemIndex];
}

// 시간으로 시지 구하기
export function getHourBranch(hour) {
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
export function analyzeFiveElements(pillars) {
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

