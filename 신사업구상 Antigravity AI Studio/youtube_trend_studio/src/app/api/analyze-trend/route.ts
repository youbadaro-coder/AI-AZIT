import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { addVideo } from '@/lib/db';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: Request) {
  try {
    const { topic, format } = await request.json();
    
    console.log(`Analyzing trends for: ${topic} [${format}]`);
    
    const prompt = `
    너는 세계 최고의 유튜브 마케팅 전문가이자 미드저니 프롬프트 엔지니어 매니저야.
    다음 주제에 대한 ${format === 'longform' ? '3분' : '30초'} 분량(약 ${format === 'longform' ? '800' : '120'}자 내외)의 유튜브 대본과, 각 장면에 매칭되는 고퀄리티 영어 생성이미지 프롬프트 3개를 작성해줘.
    
    주제: ${topic}
    포맷: ${format}
    
    다음 JSON 형식으로만 정확히 반환해:
    {
        "title": "시선을 끄는 자극적이고 호기심을 유발하는 영상 제목",
        "script": "(초반 훅) ...\\n(중반 전개) ...\\n(후반 결론) ...",
        "hashtags": "#해시태그1 #해시태그2 #해시태그3",
        "prompts": [
            "[Scene 1] 영어로 된 매우 구체적인 미드저니 프롬프트 (조명, 구도, 화풍 포함) --ar ${format === 'longform' ? '16:9' : '9:16'}",
            "[Scene 2] 영어로 된 두 번째 미드저니 프롬프트 --ar ${format === 'longform' ? '16:9' : '9:16'}",
            "[Scene 3] 영어로 된 세 번째 미드저니 프롬프트 --ar ${format === 'longform' ? '16:9' : '9:16'}"
        ]
    }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const resultText = response.text || (response.candidates && response.candidates[0].content.parts[0].text);
    if (!resultText) throw new Error("Empty response from Gemini");

    const resultObj = JSON.parse(resultText);

    // Firebase 대신 로컬 DB에 영구 저장 (의장님 클릭 불필요)
    addVideo({
      topic,
      format,
      script: resultObj.script
    });

    return NextResponse.json({ success: true, data: resultObj });
  } catch (error) {
    console.error('Trend analysis error:', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}
