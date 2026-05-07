import os
from google import genai

def generate_blog_post(product_info, api_key):
    """
    상품 정보를 바탕으로 SEO 최적화된 블로그 글을 생성합니다.
    """
    if not api_key:
        return "API 키가 필요합니다."
        
    client = genai.Client(api_key=api_key)
    
    title = product_info.get('title', '상품명 없음')
    price = product_info.get('price', '가격 정보 없음')
    features = product_info.get('features', [])
    url = product_info.get('url', '')
    
    features_str = "\n".join([f"- {f}" for f in features])
    
    prompt = f"""
    당신은 쿠팡 파트너스 수익화를 위한 전문 블로그 포스팅 작가입니다.
    다음 쿠팡 상품 정보를 바탕으로 검색 엔진(SEO)에 최적화된 매력적인 블로그 리뷰 글을 작성해주세요.
    
    [상품 정보]
    - 상품명: {title}
    - 가격: {price}
    - 상품 링크: {url}
    - 주요 특징:
    {features_str}
    
    [작성 가이드라인]
    1. 제목: 검색량이 많은 키워드(예: 추천, 내돈내산 후기, 장단점, 비교 등)를 포함하여 클릭을 유도하는 매력적인 제목으로 작성하세요. (마크다운 # 사용)
    2. 도입부: 독자의 일상적인 고민(페인포인트)을 공감하며 이 상품이 왜 필요한지 흥미를 유발하세요.
    3. 본문 (특장점): 상품의 주요 특징을 단순히 나열하지 말고, 사용자 관점에서 어떤 점이 좋은지 자연스러운 문맥으로 설명하세요. 소제목(##)을 적극 활용하세요.
    4. 신뢰도 부여: 장점만 나열하기보다는 약간의 아쉬운 점이나 주의할 점도 가볍게 언급하여 '진짜 리뷰' 같은 신뢰도를 높여주세요.
    5. 결론 및 행동 유도 (Call to Action): 구매를 망설이는 사람에게 확신을 주고, 아래 링크를 통해 확인해보라고 유도하세요. 구매 링크가 들어갈 자리에 [👉 여기를 클릭하여 최저가 확인하기] 라고 적어주세요.
    6. 글의 어조: 친근하면서도 정보 전달이 확실한 블로거 특유의 어투(~해요, ~습니다)를 사용하세요.
    7. 공정위 문구: 글 맨 마지막에 반드시 "이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다." 문구를 넣어주세요.
    
    결과물은 바로 블로그에 복사-붙여넣기 할 수 있는 마크다운 형식으로 출력해주세요.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        return response.text
    except Exception as e:
        return f"글 생성 중 오류 발생: {str(e)}"
