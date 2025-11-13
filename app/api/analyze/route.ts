import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

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
  } catch (error: any) {
    console.error('Saju analysis generation error:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sajuData } = body;
    
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
    
    console.log('Saju analysis request received');
    
    try {
      const analysis = await generateSajuAnalysis(sajuData);
      
      return NextResponse.json({
        success: true,
        analysis: analysis
      });
    } catch (error: any) {
      console.error('Analysis generation error:', error);
      return NextResponse.json(
        {
          error: '사주 풀이 생성 중 오류가 발생했습니다.',
          message: error.message
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Analyze API error:', error);
    return NextResponse.json(
      {
        error: '서버 오류가 발생했습니다.',
        message: error.message
      },
      { status: 500 }
    );
  }
}

