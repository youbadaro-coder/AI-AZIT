import os
from google import genai

def generate_blog_post(product_info, api_key):
    """
    상품 정보를 바탕으로 각 플랫폼(네이버, 티스토리, 워드프레스) 형식에 맞는 블로그 글을 생성합니다.
    """
    if not api_key:
        return None
        
    client = genai.Client(api_key=api_key)
    
    title = product_info.get('title', '상품명 없음')
    price = product_info.get('price', '가격 정보 없음')
    features = product_info.get('features', [])
    url = product_info.get('url', '')
    
    features_str = "\n".join([f"- {f}" for f in features])
    
    # 3가지 플랫폼을 위한 통합 프롬프트
    prompt = f"""
    당신은 쿠팡 파트너스 수익화를 위한 전문 블로그 포스팅 작가입니다.
    다음 상품 정보를 바탕으로 **네이버 블로그, 티스토리, 워드프레스** 3가지 플랫폼의 성격에 맞는 각각의 리뷰 글을 작성해주세요.
    
    [상품 정보]
    - 상품명: {title}
    - 가격: {price}
    - 상품 링크: {url}
    - 주요 특징: {features_str}
    
    [작성 가이드라인]
    1. **네이버 블로그**:
       - 친근한 말투(~해요, ~에요)와 풍부한 이모지 사용.
       - '내돈내산' 느낌이 나도록 주관적인 경험(가상)을 섞어 작성.
       - 가독성을 위해 짧은 문장 위주로 구성.
       - 마지막에 공정위 문구 포함.
       
    2. **티스토리**:
       - 깔끔하고 전문적인 말투(~합니다, ~입니다).
       - SEO 최적화를 위해 정보 전달에 집중 (장단점 비교 등).
       - 마크다운 형식을 잘 활용하여 구조화된 글 작성.
       - 마지막에 공정위 문구 포함.
       
    3. **워드프레스**:
       - 구글 검색 노출(SEO)을 최우선으로 고려.
       - 서술형 중심의 긴 호흡과 전문적인 키워드 배치.
       - 독자의 문제 해결에 집중하는 가이드 형식.
       - 마지막에 공정위 문구 포함.
    
    [출력 형식]
    반드시 아래의 JSON 형식을 유지하여 출력해주세요. (다른 설명 없이 JSON만 출력)
    {{
      "naver": "네이버 블로그 포스팅 내용...",
      "tistory": "티스토리 포스팅 내용...",
      "wordpress": "워드프레스 포스팅 내용..."
    }}
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash', # 혹은 사용 가능한 모델
            contents=prompt,
            config={
                "response_mime_type": "application/json"
            }
        )
        import json
        return json.loads(response.text)
    except Exception as e:
        print(f"글 생성 중 오류 발생: {e}")
        return {
            "naver": f"오류 발생: {str(e)}",
            "tistory": f"오류 발생: {str(e)}",
            "wordpress": f"오류 발생: {str(e)}"
        }

