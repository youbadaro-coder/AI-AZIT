import time
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def get_coupang_product_info(url):
    """
    쿠팡 상품 페이지에서 상품 정보를 스크래핑합니다.
    """
    options = Options()
    options.add_argument('--headless')
    options.add_argument('--disable-gpu')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    # 쿠팡 봇 차단 우회를 위한 User-Agent 설정
    options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    
    driver = None
    try:
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
        
        driver.get(url)
        # 페이지 로딩 대기
        time.sleep(3) 
        
        html = driver.page_source
        soup = BeautifulSoup(html, 'html.parser')
        
        # 1. 상품명 추출
        title = ""
        title_tag = soup.select_one('h2.prod-buy-header__title')
        if title_tag:
            title = title_tag.text.strip()
            
        # 2. 가격 추출
        price = ""
        price_tag = soup.select_one('span.total-price > strong')
        if not price_tag:
            price_tag = soup.select_one('span.price-value')
        if price_tag:
            price = price_tag.text.strip()
            
        # 3. 특장점/상세 설명 추출 (주요 스펙)
        features = []
        feature_tags = soup.select('ul.prod-description-attribute > li')
        for tag in feature_tags:
            features.append(tag.text.strip())
            
        product_info = {
            "url": url,
            "title": title,
            "price": price,
            "features": features
        }
        
        return product_info
        
    except Exception as e:
        print(f"스크래핑 중 오류 발생: {e}")
        return None
        
    finally:
        if driver:
            driver.quit()

if __name__ == "__main__":
    # 테스트용 코드
    test_url = "https://www.coupang.com/vp/products/7335597976"
    info = get_coupang_product_info(test_url)
    print(info)
