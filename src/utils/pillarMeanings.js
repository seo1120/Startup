/**
 * 사주 기둥 의미 설명
 */

const STEM_MEANINGS = {
    '甲': { element: 'Wood', nature: 'Strong, upright, leader-like', energy: 'Growth and expansion' },
    '乙': { element: 'Wood', nature: 'Flexible, adaptable, gentle', energy: 'Gentle growth and nurturing' },
    '丙': { element: 'Fire', nature: 'Bright, enthusiastic, radiant', energy: 'Passion and illumination' },
    '丁': { element: 'Fire', nature: 'Focused, refined, detail-oriented', energy: 'Precise warmth and light' },
    '戊': { element: 'Earth', nature: 'Stable, reliable, grounded', energy: 'Foundation and stability' },
    '己': { element: 'Earth', nature: 'Nurturing, receptive, fertile', energy: 'Nurturing and cultivation' },
    '庚': { element: 'Metal', nature: 'Strong, decisive, structured', energy: 'Structure and discipline' },
    '辛': { element: 'Metal', nature: 'Refined, elegant, precise', energy: 'Refinement and precision' },
    '壬': { element: 'Water', nature: 'Flowing, adaptable, wise', energy: 'Flow and adaptability' },
    '癸': { element: 'Water', nature: 'Gentle, intuitive, deep', energy: 'Depth and intuition' }
};

const BRANCH_MEANINGS = {
    '子': { element: 'Water', nature: 'Deep, mysterious, introspective', energy: 'Inner depth and wisdom' },
    '丑': { element: 'Earth', nature: 'Patient, persistent, methodical', energy: 'Steady progress' },
    '寅': { element: 'Wood', nature: 'Active, adventurous, pioneering', energy: 'New beginnings and growth' },
    '卯': { element: 'Wood', nature: 'Gentle, harmonious, balanced', energy: 'Harmony and balance' },
    '辰': { element: 'Earth', nature: 'Dynamic, changeable, resourceful', energy: 'Transformation' },
    '巳': { element: 'Fire', nature: 'Intelligent, strategic, transformative', energy: 'Transformation through wisdom' },
    '午': { element: 'Fire', nature: 'Energetic, passionate, expressive', energy: 'Vitality and expression' },
    '未': { element: 'Earth', nature: 'Nurturing, caring, gentle', energy: 'Care and nurturing' },
    '申': { element: 'Metal', nature: 'Quick, clever, adaptable', energy: 'Quick thinking and adaptability' },
    '酉': { element: 'Metal', nature: 'Refined, aesthetic, precise', energy: 'Refinement and beauty' },
    '戌': { element: 'Earth', nature: 'Loyal, protective, stable', energy: 'Protection and loyalty' },
    '亥': { element: 'Water', nature: 'Intuitive, emotional, flowing', energy: 'Emotional flow and intuition' }
};

function getPillarMeaning(pillar, type) {
    const stem = pillar.charAt(0);
    const branch = pillar.charAt(1);
    
    const stemInfo = STEM_MEANINGS[stem];
    const branchInfo = BRANCH_MEANINGS[branch];
    
    if (!stemInfo || !branchInfo) {
        return null;
    }
    
    return {
        stem: {
            hanja: stem,
            element: stemInfo.element,
            nature: stemInfo.nature,
            energy: stemInfo.energy
        },
        branch: {
            hanja: branch,
            element: branchInfo.element,
            nature: branchInfo.nature,
            energy: branchInfo.energy
        },
        combined: {
            element: `${stemInfo.element}-${branchInfo.element}`,
            meaning: `The ${stemInfo.element} stem combines with the ${branchInfo.element} branch, creating a ${type} that reflects ${stemInfo.nature.toLowerCase()} qualities with ${branchInfo.nature.toLowerCase()} foundations.`
        }
    };
}

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

module.exports = {
    getPillarMeaning,
    getPillarTypeDescription,
    STEM_MEANINGS,
    BRANCH_MEANINGS
};


