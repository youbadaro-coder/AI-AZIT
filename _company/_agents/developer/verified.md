# 💻 Developer — 검증된 지식

_Self-RAG가 출력에서 `[근거: ...]` 태그가 붙은 주장만 자동 승격해서 누적._
_여기 들어온 내용만 다음 사이클의 retrieval 우선순위에 들어갑니다._
_사용자가 직접 줄을 지우면 그 주장은 다시 미검증 상태로 돌아갑니다._


- [2026-05-08] cvr_data = MockCVRDBAPI().fetch_user_conversion_rate(user_id) # API 호출 모킹 _(근거: API Mockup Layer)_