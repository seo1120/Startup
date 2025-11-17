import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getSajuAnalysisPrompt } from '../../utils/sajuAnalysisPrompt';
import { logger } from '../../utils/logger';

// 계절별 인사 멘트 생성
function getSeasonalGreeting(month: number) {
  const monthNum = parseInt(month.toString());
  const seasonMessages: { [key: string]: { months: number[]; message: string } } = {
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
function getTimeGreeting(hour: number) {
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Good night";
}

// 사주 기둥 기본 설명 (고정)
function getPillarTypeDescription(type: string) {
  const descriptions: { [key: string]: { title: string; meaning: string; influence: string } } = {
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
async function generateSajuAnalysis(sajuData: any) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }
  
  const openai = new OpenAI({ 
    apiKey: apiKey,
    timeout: 30000,
    maxRetries: 2
  });
  
  // 계절별 인사 멘트
  const seasonalGreeting = getSeasonalGreeting(sajuData.solar.month);
  const timeGreeting = getTimeGreeting(parseInt(sajuData.input.original?.hour || '12'));
  
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
  
  // 사용자 이름 가져오기
  const userName = sajuData.input?.name || name || '';
  const displayName = userName || (gender === 'male' ? 'this person' : 'this person');
  
  // 인사 멘트 (고정)
  let greeting = `${seasonalGreeting}\n\n`;
  greeting += `This is a wonderful time to reflect on the past year and prepare your heart for what's ahead.\n\n`;
  if (userName) {
    greeting += `Today, let's explore the Saju of ${userName}, a ${gender} born on ${birthMonth}/${birthDay}/${birthYear} at ${timeString} in ${birthplace}.\n\n`;
  } else {
    greeting += `Today, let's explore the Saju of a ${gender} born on ${birthMonth}/${birthDay}/${birthYear} at ${timeString} in ${birthplace}.\n\n`;
  }
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
  
  // 프롬프트 파일에서 가져오기
  const analysisPrompt = getSajuAnalysisPrompt(sajuInfo);
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' } // JSON 형식으로 응답 요구
    });
    
    const llmResponse = response.choices[0].message.content;
    
    // JSON 파싱 시도
    let analysisData;
    try {
      analysisData = JSON.parse(llmResponse || '{}');
    } catch (parseError) {
      logger.error('Failed to parse LLM JSON response', parseError);
      // JSON 파싱 실패 시 기본 구조 반환
      analysisData = { 
        error: 'Failed to parse analysis response',
        longFormNarrative: llmResponse || 'Analysis generation failed.' 
      };
    }
    
    // JSON 데이터에 기본 정보 추가
    analysisData.greeting = greeting;
    analysisData.pillarSection = pillarSection;
    
    // JSON 데이터를 그대로 반환 (프론트엔드에서 카드 형식으로 표시)
    return JSON.stringify(analysisData);
  } catch (error: any) {
    logger.error('Saju analysis generation error', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sajuData, name } = body;
    
    if (!sajuData || typeof sajuData !== 'object') {
      return NextResponse.json(
        { error: 'Saju data is required. Please calculate your Saju first.' },
        { status: 400 }
      );
    }
    
    // 필수 필드 검증
    if (!sajuData.pillars || !sajuData.solar || !sajuData.fiveElements) {
      return NextResponse.json(
        { error: 'Invalid saju data format.' },
        { status: 400 }
      );
    }
    
    logger.log('Saju analysis request received');
    
    try {
      const analysis = await generateSajuAnalysis(sajuData);
      
      return NextResponse.json({
        success: true,
        analysis: analysis, // JSON 문자열
        analysisData: JSON.parse(analysis) // 파싱된 객체도 함께 제공
      });
    } catch (error: any) {
      logger.error('Analysis generation error', error);
      return NextResponse.json(
        {
          error: 'I apologize, but I encountered an issue while generating your Saju analysis. Please try again in a moment.'
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    logger.error('Analyze API error', error);
    return NextResponse.json(
      {
        error: 'I apologize, but I encountered an issue. Please try again in a moment.'
      },
      { status: 500 }
    );
  }
}

