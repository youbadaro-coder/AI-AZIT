# 💻 Developer — Notion 템플릿 구조와 판매 페이지 데이터 파이프라인에 따라 초기 개발 코드를 준비하고 통합 테스트 계획을 수립해야 함.

💻 Developer: 작업 시작합니다.

CEO의 지시사항을 확인했습니다. Notion 템플릿 구조와 판매 페이지 데이터 파이프라인에 기반한 초기 개발 코드 준비 및 통합 테스트 계획 수립을 즉시 착수하겠습니다.

현재 상황은 **'P1 영상 제작 및 배포 확정'** 단계이며, 다음 목표는 **Notion 기반의 콘텐츠 관리 시스템(CMS)과 디지털 상품 판매를 위한 데이터 파이프라인 구축**입니다.

아래에 필요한 초기 개발 스펙과 통합 테스트 계획을 제시합니다.

---

## 1. Notion 템플릿 구조 및 초기 개발 코드 준비 (Backend/Frontend Specification)

Notion 템플릿은 콘텐츠 관리(CMS 역할)와 데이터 입력의 표준화된 인터페이스 역할을 해야 합니다.

### 1.1. Notion 템플릿 구조 제안 (Database Structure)

핵심적으로 **'콘텐츠 마스터 DB'**와 **'판매 데이터 DB'** 두 가지 핵심 데이터베이스를 설계합니다.

#### A. 콘텐츠 마스터 DB (`Content_Master_DB`)
이 DB는 모든 영상, 스크립트, 썸네일 컨셉의 메타데이터를 저장합니다.

| 속성 (Property) | 타입 | 설명 | 필수 여부 | 연관 관계 |
| :--- | :--- | :--- | :--- | :--- |
| **Content_ID** | Title (Unique ID) | 고유 식별자 (UUID 또는 자동 생성) | 필수 | N/A |
| **Platform** | Select | YouTube, Instagram, Threads 등 플랫폼 지정 | 필수 | N/A |
| **Video_Title** | Title | 최종 확정 제목 | 필수 | N/A |
| **Script_Text** | Text | 최종 스크립트 본문 (HTML 지원 권장) | 필수 | N/A |
| **Thumbnail_Concept** | Relation | Designer 산출물(Concept A, B, C 등)과 연결 | 필수 | Designer DB |
| **Status** | Select | Draft, Review, Approved, Published | 필수 | N/A |
| **Upload_Date** | Date | 실제 업로드 예정일 | 선택 | N/A |
| **CTR_Metric** | Number | A/B 테스트 결과 측정치 (초기 단계) | 선택 | N/A |

#### B. 판매 데이터 파이프라인 DB (`Sales_Pipeline_DB`)
디지털 상품의 판매 추적 및 가격 전략(Tiered Pricing) 관리를 위한 DB입니다.

| 속성 (Property) | 타입 | 설명 | 필수 여부 | 연관 관계 |
| :--- | :--- | :--- | :--- | :--- |
| **Sale_ID** | Title (Unique ID) | 고유 판매 기록 식별자 | 필수 | N/A |
| **Content_ID** | Relation | 해당 상품이 연결된 콘텐츠 마스터 DB의 ID | 필수 | Content_Master_DB |
| **Product_Tier** | Select | Basic, Pro, Premium 등 가격 티어 지정 | 필수 | N/A |
| **Price_USD** | Number | 설정된 판매 가격 | 필수 | N/A |
| **Sale_Date** | Date | 실제 구매 발생일 | 선택 | N/A |
| **Customer_Email** | Email | 구매 고객 이메일 주소 (개인정보 처리 주의) | 선택 | N/A |
| **Payment_Status** | Select | Pending, Paid, Failed | 필수 | N/A |

### 1.2. 초기 개발 코드 스켈레톤 (Python/Node.js 기반 가정)

실제 환경(예: Python의 FastAPI 또는 Node.js Express 서버)에서 Notion API와 데이터베이스 간의 연동을 위한 최소한의 구조를 제시합니다. (Notion API 연동을 전제로 함)

**File: `data_pipeline_service.py` (Python 예시)**

```python
import os
# Notion API 클라이언트 임포트 가정
from notion_client import Client 

NOTION_TOKEN = os.environ.get("NOTION_API_KEY")
NOTION_DATABASE_ID = "YOUR_CONTENT_MASTER_DB_ID"

class DataPipelineService:
    def __init__(self):
        """Notion API 클라이언트를 초기화합니다."""
        if not NOTION_TOKEN:
            raise ValueError("NOTION_API_KEY 환경 변수가 설정되지 않았습니다.")
        self.notion = Client(auth=NOTION_TOKEN)

    def create_content_entry(self, title: str, platform: str, script: str, thumbnail_ref_id: str):
        """콘텐츠 마스터 DB에 새로운 항목을 생성합니다."""
        try:
            response = self.notion.pages.create(
                parent={"database_id": NOTION_DATABASE_ID},
                properties={
                    "Name": {"title": [{"text": {"content": title}}]},
                    "Platform": {"select": {"name": platform}},
                    "Script_Text": {"rich_text": [{"text": {"content": script}}]},
                    "Thumbnail_Concept": {"relation": {"id": thumbnail_ref_id}} # Relation 설정 예시
                }
            )
            print(f"✅ 콘텐츠 항목 생성 성공. ID: {response['id']}")
            return response['id']
        except Exception as e:
            print(f"❌ 콘텐츠 항목 생성 실패: {e}")
            return None

    def log_sales_record(self, content_id: str, tier: str, price: float, email: str = None):
        """판매 데이터 파이프라인에 기록을 남깁니다."""
        try:
            self.notion.pages.create(
                parent={"database_id": "YOUR_SALES_PIPELINE_DB_ID"}, # 판매 DB ID로 변경 필요
                properties={
                    "Content_ID": {"relation": {"id": content_id}},
                    "Product_Tier": {"select": {"name": tier}},
                    "Price_USD": {"number": price},
                    "Payment_Status": {"select": {"name": "Paid"}}
                }
            )
            print(f"✅ 판매 기록 성공. Content ID: {content_id}")
        except Exception as e:
            print(f"❌ 판매 기록 실패: {e}")

# --- 실행 예시 (실제 호출은 별도의 로직에서 구성 필요) ---
if __name__ == "__main__":
    # 이 부분은 실제 환경 변수 설정 후 테스트되어야 함
    try:
        pipeline = DataPipelineService()
        # content_id = pipeline.create_content_entry(
        #     title="P1 영상 최종 제목", 
        #     platform="YouTube", 
        #     script="...", 
        #     thumbnail_ref_id="CONCEPT_A_SPEC_ID"
        # )
        pass
    except ValueError as e:
        print(f"환경 설정 오류: {e}")

```

---

## 2. 통합 테스트 계획 (Integration Testing Plan)

개발된 코드와 Notion 구조가 의도대로 동작하는지 검증하기 위한 단계별 계획입니다.

### 2.1. 단위 테스트 (Unit Tests - 기능 검증)

**목표:** `DataPipelineService` 내부 메서드가 독립적으로 정확하게 작동하는지 확인합니다.

1.  **테스트 대상:** `create_content_entry()` 메서드
    *   **시나리오 1 (성공):** 유효한 입력값(제목, 플랫폼 등)을 전달했을 때 Notion API가 성공 응답을 반환하고 새로운 페이지가 생성되는지 확인.
    *   **시나리오 2 (실패 처리):** 필수 파라미터(예: `NOTION_TOKEN` 누락)가 없을 때 예외(`ValueError`)가 정확히 발생하는지 확인.
2.  **테스트 대상:** `log_sales_record()` 메서드
    *   **시나리오 1 (성공):** 유효한 `Content_ID`, 가격, 티어를 전달했을 때 판매 DB에 기록이 성공적으로 남는지 확인.
    *   **시나리오 2 (실패 처리):** 존재하지 않는 `Content_ID`를 전달했을 때 Notion API가 적절한 에러 코드를 반환하고 예외 처리가 되는지 확인.

### 2.2. 통합 테스트 (Integration Tests - 시스템 검증)

**목표:** 데이터 흐름(Notion $\rightarrow$ Code $\rightarrow$ Notion)이 원활하게 작동하는지 확인합니다.

1.  **테스트 시나리오 A: 콘텐츠 생성 및 연결 흐름**
    *   **단계 1:** `create_content_entry` 함수를 호출하여 **Content\_ID (예: C101)**를 획득한다.
    *   **단계 2:** 획득한 **C101**을 사용하여 `log_sales_record` 함수를 호출하고, 이 과정에서 판매 DB에 **C101과 연결된 레코드**가 정확히 생성되는지 Notion UI/API를 통해 검증한다.
    *   **검증 포인트:** Content\_Master\_DB와 Sales\_Pipeline\_DB 간의 `Relation` 필드가 양방향으로 올바르게 매핑되었는지 확인.

2.  **테스트 시나리오 B: 데이터 무결성 테스트 (Edge Cases)**
    *   **시나리오 1 (데이터 유효성):** 스크립트 본문에 **특수 문자(HTML 태그 등)**가 포함된 경우, Notion이 이를 안전하게 처리하고 저장하는지 확인.
    *   **시나리오 2 (API Rate Limiting):** 짧은 시간 내에 과도한 API 호출을 시뮬레이션하여 서버 측에서 발생하는 Rate Limit 에러를 적절히 감지하고 재시도 로직(Retry Mechanism)이 있다면 정상 작동하는지 확인.

---

📝 다음 단계 제안:
1.  실제 Notion API 키와 데이터베이스 ID를 설정하고, 위 스켈레톤 코드를 실제 환경에서 구동하여 **단위 테스트**를 즉시 수행하십시오.
2.  테스트 결과(성공/실패 로그 포함)를 공유해 주시면, 이 결과를 바탕으로 **데이터 파이프라인의 최종 배포 코드(Production Ready Code)**를 작성하는 단계로 넘어가겠습니다.
