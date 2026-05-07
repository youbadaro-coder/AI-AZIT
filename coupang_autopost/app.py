import streamlit as st
import time
from scraper import get_coupang_product_info
from generator import generate_blog_post

st.set_page_config(page_title="쿠팡 파트너스 자동 포스팅", page_icon="🛍️", layout="wide")

st.title("🛍️ 쿠팡 파트너스 자동 블로그 포스팅 봇")
st.markdown("쿠팡 상품 링크를 입력하면 SEO 최적화된 블로그 리뷰 글을 자동으로 생성해 줍니다.")

# 사이드바에 API 키 입력란 배치
with st.sidebar:
    st.header("⚙️ 설정")
    api_key = st.text_input("Gemini API Key", type="password", help="Google AI Studio에서 발급받은 API 키를 입력하세요.")
    st.markdown("[API 키 발급받기](https://aistudio.google.com/app/apikey)")
    
st.markdown("---")

col1, col2 = st.columns([1, 2])

with col1:
    st.subheader("1. 쿠팡 링크 입력")
    product_url = st.text_input("쿠팡 상품 URL", placeholder="https://www.coupang.com/vp/products/...")
    
    generate_btn = st.button("🚀 블로그 글 생성하기", use_container_width=True, type="primary")
    
    if generate_btn:
        if not api_key:
            st.error("좌측 사이드바에서 Gemini API 키를 먼저 입력해주세요.")
            st.stop()
            
        if not product_url:
            st.warning("쿠팡 상품 URL을 입력해주세요.")
            st.stop()
            
        with st.status("상품 정보를 가져오는 중입니다... (약 5~10초 소요)", expanded=True) as status:
            st.write("크롤러 로딩 및 접근 중...")
            product_info = get_coupang_product_info(product_url)
            
            if not product_info:
                status.update(label="크롤링 실패", state="error", expanded=False)
                st.error("상품 정보를 가져오지 못했습니다. 링크가 올바른지 확인해주세요. (또는 쿠팡의 봇 차단 정책 때문일 수 있습니다.)")
                st.stop()
                
            st.write(f"✅ 상품명: {product_info['title']}")
            st.write(f"✅ 가격: {product_info['price']}")
            st.write("AI가 블로그 글을 작성하는 중입니다...")
            
            blog_post = generate_blog_post(product_info, api_key)
            
            status.update(label="글 생성 완료!", state="complete", expanded=False)
            
            # 세션 스테이트에 저장
            st.session_state['blog_post'] = blog_post
            st.session_state['product_info'] = product_info

with col2:
    st.subheader("2. 생성된 블로그 글")
    
    if 'blog_post' in st.session_state:
        st.success("완성되었습니다! 아래 텍스트를 복사하여 블로그에 붙여넣어주세요.")
        st.text_area("마크다운 소스", st.session_state['blog_post'], height=400)
        
        st.markdown("---")
        st.markdown("### 📝 미리보기")
        # 미리보기 배경색 처리를 위해 컨테이너 사용
        with st.container():
            st.markdown(st.session_state['blog_post'])
    else:
        st.info("좌측에서 링크를 입력하고 생성 버튼을 누르면 여기에 글이 나타납니다.")
