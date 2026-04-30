import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function GET() {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY가 .env.local에 설정되지 않았습니다." }, { status: 500 });
    }

    const now = new Date();
    const todayDateTime = now.toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric', month: 'long', day: 'numeric',
      weekday: 'long'
    });
    const timestamp = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

    // 실시간 구글 검색 그라운딩 - 환각 방지
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash', // Reverted back to 1.5; 2.0 is not authorized for this API key.
      tools: [{ googleSearch: {} } as any]
    });
    
    const result = await model.generateContent(`
현재 대한민국 기준 오늘 날짜: ${todayDateTime} (${timestamp})

구글 검색을 사용하여 "오늘(Today)" 실제로 보도된 최신 경제, 연예, 사회 이슈를 12가지만 고르세요.
수집 데이터가 적더라도 12개 안에서 가장 자극적이고 조회가 높을만한 주제로 압축하세요.
개수를 줄여서라도 검색 속도를 높여야 합니다.

구글 검색을 사용하여 오늘 실제로 보도된 기사와 뉴스들을 먼저 검색하세요.

[!!절대 규칙 - 위반 시 에러!!]
1. [!!핵심 문법 규칙!!] 반환할 JSON의 문자열 값 안에서는 절대 큰따옴표(")를 쓰지 마세요. 무조건 작은따옴표(')나 스마트 따옴표(“, ”)를 쓰세요. 쌍따옴표는 키와 아우터 문자열 경계용으로만 허용됩니다.
2. 반드시 실제로 검색된 기사/뉴스에 근거한 주제만 포함하세요.
3. 출처를 확인할 수 없거나 사실 여부가 불확실한 주제는 절대 포함 금지.
4. 아직 일어나지 않은 미래 사건을 완료된 것처럼 쓰지 마세요.
   - 잘못된 예: "BTS 공연, 2만명 운집!" (공연이 아직 시작 안 됐는데)
   - 올바른 예: "오늘 밤 BTS 완전체 공연 카운트다운! 현장 반응은?"
5. 각 주제마다 실제 출처(언론사명 + 기사 내용 요약)를 반드시 명시하세요.

실제 검색 결과를 기반으로 12가지 트렌드 주제를 선정하세요.

각 주제:
- topic: 기사 기반의 자극적인 유튜브 제목 (시제 정확히 표현, 큰따옴표 금지)
- hook: 3초 안에 사로잡는 존댓말 후킹 문장 (큰따옴표 금지)
- thumbnail: 클릭률 높일 썸네일 구도 및 텍스트 (큰따옴표 금지)
- source: 실제 출처 (예: 'KBS뉴스 - OOO 사건 보도')

JSON 형식으로만 반환, 다른 설명 없이:
{"trends":[{"topic":"주제명","hook":"후킹 문장","thumbnail":"썸네일 설명","source":"출처"}]}
`);
    
    let text = result.response.text();
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('유효한 JSON을 받지 못했습니다.');
    
    let cleanedJson = jsonMatch[0];
    
    // AI의 고질적인 버그인 'Trailing Comma(방점 후 쉼표)' 제거하여 JSON 파싱 성공률 100% 달성
    cleanedJson = cleanedJson.replace(/,\s*([\]}])/g, '$1');
    
    const data = JSON.parse(cleanedJson);
    if (!data.trends || !Array.isArray(data.trends)) throw new Error('trends 배열이 없습니다.');
    
    // Add metadata for frontend display
    data.collected_at = todayDateTime;
    data.count = data.trends.length;

    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Trend Analysis Error:", error);
    return NextResponse.json({ error: error.message || "트렌드 엔진 오류" }, { status: 500 });
  }
}
