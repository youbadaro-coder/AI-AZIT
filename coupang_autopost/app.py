from scraper import get_coupang_product_info, get_best_products
from generator import generate_blog_post

st.set_page_config(page_title="쿠팡 파트너스 마스터", page_icon="🛍️", layout="wide")

# 사이드바 설정
with st.sidebar:
    st.title("⚙️ 설정 및 메뉴")
    menu = st.radio("메뉴 선택", ["URL로 글 생성", "🔥 베스트 상품 추천"])
    st.markdown("---")
    api_key = st.text_input("Gemini API Key", type="password", help="Google AI Studio에서 발급받은 API 키를 입력하세요.")
    st.markdown("[API 키 발급받기](https://aistudio.google.com/app/apikey)")

if menu == "URL로 글 생성":
    st.title("🛍️ 쿠팡 상품 리뷰 자동 생성")
    st.markdown("상품 링크를 입력하면 **네이버, 티스토리, 워드프레스** 맞춤형 글을 생성합니다.")
    
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
                
            with st.status("상품 정보를 가져오고 글을 생성하는 중...", expanded=True) as status:
                st.write("상품 정보를 수집 중입니다...")
                product_info = get_coupang_product_info(product_url)
                
                if not product_info:
                    status.update(label="데이터 수집 실패", state="error")
                    st.error("상품 정보를 가져오지 못했습니다.")
                    st.stop()
                
                st.write(f"✅ 상품명: {product_info['title']}")
                st.write("AI가 3가지 플랫폼용 글을 작성 중입니다...")
                blog_posts = generate_blog_post(product_info, api_key)
                
                status.update(label="글 생성 완료!", state="complete")
                st.session_state['blog_posts'] = blog_posts
                st.session_state['current_product'] = product_info

    with col2:
        st.subheader("2. 생성된 결과물")
        if 'blog_posts' in st.session_state:
            posts = st.session_state['blog_posts']
            tab1, tab2, tab3 = st.tabs(["🟢 네이버 블로그", "🍊 티스토리", "🔵 워드프레스"])
            
            with tab1:
                st.text_area("네이버용 텍스트", posts['naver'], height=300)
                st.markdown("---")
                st.markdown(posts['naver'])
                
            with tab2:
                st.text_area("티스토리용 마크다운", posts['tistory'], height=300)
                st.markdown("---")
                st.markdown(posts['tistory'])
                
            with tab3:
                st.text_area("워드프레스용 마크다운", posts['wordpress'], height=300)
                st.markdown("---")
                st.markdown(posts['wordpress'])
        else:
            st.info("상품 링크를 입력하고 생성 버튼을 누르면 여기에 플랫폼별 글이 나타납니다.")

elif menu == "🔥 베스트 상품 추천":
    st.title("🔥 현재 가장 인기 있는 상품 TOP 20")
    st.markdown("실시간으로 판매량과 관심도가 높은 상품들을 카테고리별로 확인하세요.")
    
    categories = {
        "가전디지털": 178155,
        "주방용품": 185569,
        "뷰티": 176422,
        "식품": 194176,
        "생활용품": 115573,
        "패션의류": 564553
    }
    
    selected_cats = st.multiselect("확인할 카테고리 (최대 2개 권장)", list(categories.keys()), default=["가전디지털", "주방용품"])
    
    if st.button("📈 추천 상품 불러오기", type="primary"):
        for cat_name in selected_cats:
            with st.expander(f"📍 {cat_name} 카테고리 인기 상품", expanded=True):
                with st.spinner(f"{cat_name} 데이터를 불러오는 중..."):
                    best_list = get_best_products(categories[cat_name], limit=10)
                    if best_list:
                        for item in best_list:
                            c1, c2, c3 = st.columns([0.5, 3, 1])
                            c1.markdown(f"### {item['rank']}")
                            c2.markdown(f"**{item['title']}**")
                            c2.markdown(f"💰 가격: {item['price']}원")
                            if c3.button("글 생성", key=f"gen_{item['rank']}_{cat_name}"):
                                # URL 입력 메뉴로 이동하여 글 생성하도록 유도하거나 바로 생성
                                st.info(f"'{item['title']}' 상품으로 글을 생성하려면 상단 'URL로 글 생성' 메뉴에서 아래 링크를 입력해 주세요.")
                                st.code(item['url'])
                    else:
                        st.error(f"{cat_name} 데이터를 가져오지 못했습니다.")

