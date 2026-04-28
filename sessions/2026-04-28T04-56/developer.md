# 💻 Developer — Notion 템플릿 구조와 판매 페이지 데이터 파이프라인에 따라 초기 개발 코드를 준비하고 API 엔드포인트 환경 구축을 완료하라.

💻 Developer: 작업 시작합니다.

CEO의 지시사항("Notion 템플릿 구조와 판매 페이지 데이터 파이프라인에 따라 초기 개발 코드를 준비하고 API 엔드포인트 환경 구축을 완료하라")을 기반으로, Notion 연동 및 데이터 파이프라인을 위한 초기 개발 환경 구성을 수행하겠습니다.

현재 시점에서는 실제 API 키나 외부 서비스 연결 정보가 제공되지 않았으므로, **Next.js/Node.js 기반의 모킹(Mocking) 환경**에서 데이터 흐름과 엔드포인트 구조를 정의하고 핵심 로직을 구현합니다.

### 1. 기술 스택 및 아키텍처 결정

*   **프론트엔드:** Next.js (React) - 빠른 프로토타이핑 및 SEO 최적화.
*   **백엔드/API:** Node.js (Express 또는 Next.js API Routes) - 데이터 처리 로직 구현.
*   **데이터베이스 연동 (Mock):** JSON 파일 또는 In-memory DB를 사용하여 초기 파이프라인 시뮬레이션.

### 2. Notion 데이터 구조 설계 (Schema Definition)

판매 페이지에 필요한 핵심 데이터를 추출하기 위한 Notion DB의 스키마를 정의합니다.

**Notion Database Name:** `Digital_Product_Metrics`

| Property Name | Type | Description | Purpose in Pipeline |
| :--- | :--- | :--- | :--- |
| `product_id` | Title (Text) | 고유 상품 식별자 (UUID 또는 SKU) | Primary Key |
| `title` | Title (Text) | 상품명 | Display Name |
| `price_tier` | Select | 가격 티어 (`Basic`, `Pro`, `Enterprise`) | Pricing Logic Mapping |
| `status` | Status (Select) | 판매 상태 (`Draft`, `Published`, `Archived`) | Content Visibility Control |
| `sales_data` | Number | 일별/주간 판매량 데이터 | Analytics Input |
| `conversion_rate` | Number (Percent) | 전환율 (%) | Performance Metric |
| `api_endpoint` | URL | 해당 상품의 실제 API 엔드포인트 (외부 연동 시) | External Integration Target |

### 3. 초기 개발 코드 (Next.js/Node.js Mock Implementation)

다음은 데이터 파이프라인의 핵심 로직을 보여주는 Next.js 기반의 API 라우트 예시입니다. 이 코드는 Notion에서 데이터를 가져와서 판매 페이지에 표시할 수 있도록 설계되었습니다.

#### 파일 1: `pages/api/products.js` (API Endpoint)

```javascript
// sessions/2026-04-28T04-06/developer.md 에 기반한 초기 개발 코드 스니펫

import { useState, useEffect } from 'react';

// -----------------------------------------------------------
// MOCK DATA: 실제 Notion API 호출을 대체하기 위한 더미 데이터
// 실제 환경에서는 여기서 Notion SDK를 사용하여 데이터를 가져와야 합니다.
const mockNotionData = [
  {
    product_id: 'PROD-001',
    title: 'CTR 최적화 마스터 클래스 (Pro Tier)',
    price_tier: 'Pro',
    status: 'Published',
    sales_data: 1520, // 이번 주 판매량
    conversion_rate: 3.4,
    api_endpoint: '/api/v1/products/PROD-001'
  },
  {
    product_id: 'PROD-002',
    title: '초급자용 데이터 파이프라인 튜토리얼 (Basic Tier)',
    price_tier: 'Basic',
    status: 'Draft',
    sales_data: 450,
    conversion_rate: 1.8,
    api_endpoint: '/api/v1/products/PROD-002'
  },
];

/**
 * API Endpoint: /api/products
 * Notion DB에서 상품 목록을 가져와 판매 페이지에 제공하는 역할 수행
 */
export default function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // 1. 실제 구현 시: Notion SDK를 사용하여 데이터베이스 조회 로직 삽입
      // const notionData = await notionClient.query('Digital_Product_Metrics');

      // 2. 현재는 Mock Data 반환
      res.status(200).json({ 
        success: true, 
        data: mockNotionData 
      });
    } catch (error) {
      console.error("Error fetching product data:", error);
      res.status(500).json({ success: false, message: 'Failed to retrieve product data.' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
```

#### 파일 2: `components/ProductList.js` (프론트엔드 컴포넌트)

```javascript
// components/ProductList.js

import React from 'react';

const ProductList = ({ products }) => {
  if (!products || products.length === 0) {
    return <div className="p-6 text-center text-gray-400">아직 등록된 상품이 없습니다.</div>;
  }

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold border-b pb-2 border-white/20">판매 상품 목록</h2>
      {products.map((product) => (
        <div key={product.product_id} className="bg-[#1A1A1A] p-6 rounded-lg shadow-xl border border-gray-700 transition duration-300 hover:border-[#FF4500]/50">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-2xl font-extrabold text-white leading-snug">{product.title}</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                product.status === 'Published' ? 'bg-green-600 text-white' : 'bg-yellow-600 text-gray-900'
            }`}>
              {product.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">가격 티어:</p>
              <p className="text-lg font-bold text-[#00FFFF]">{product.price_tier}</p>
            </div>
            <div>
              <p className="text-gray-400">판매량 (주간):</p>
              <p className="text-2xl font-extrabold text-[#FF4500]">{product.sales_data.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-400">전환율:</p>
              <p className="text-2xl font-extrabold text-white">{product.conversion_rate}%</p>
            </div>
            <div>
              <p className="text-gray-400">API 엔드포인트:</p>
              <code className="block bg-gray-800 p-2 rounded text-xs truncate">{product.api_endpoint}</code>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductList;
```

### 4. API 엔드포인트 환경 구축 요약 (Execution Summary)

1.  **데이터 파이프라인 정의 완료:** Notion DB 스키마(`Digital_Product_Metrics`)를 통해 필요한 데이터 항목을 명확히 정의했습니다.
2.  **API 엔드포인트 구현:** Next.js API Route (`/api/products`)를 구축하여, **Notion에서 데이터를 가져와서 프론트엔드로 전달하는 통로(Gateway)** 역할을 수행하도록 코드를 작성했습니다. (현재는 Mock Data 사용)
3.  **프론트엔드 연동 준비:** `ProductList` 컴포넌트를 통해 API로부터 받은 구조화된 데이터를 시각적으로 매력적인 형태로 렌더링할 준비를 마쳤습니다.

이 초기 환경은 실제 Notion API 통합을 위한 **안정적인 기반**이며, 다음 단계에서는 실제 인증(Authentication) 및 데이터 변환 로직을 추가하여 완성도를 높일 것입니다.

📝 다음 단계 제안:
1.  **Notion SDK 연동:** 실제 Notion API 키를 설정하고, `pages/api/products.js` 내에서 Notion SDK를 사용하여 `Digital_Product_Metrics` DB에서 데이터를 동기적으로 가져오는 로직을 구현합니다.
2.  **판매 페이지 데이터 파이프라인 코어 개발:** 판매 페이지(예: `/dashboard`)에 필요한 데이터 구조(데이터 변환, 필터링, 집계)를 정의하는 핵심 함수(`dataPipeline.js`)를 별도로 개발하여 모듈화합니다.
