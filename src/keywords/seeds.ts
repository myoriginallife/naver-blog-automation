import type { Category } from "../types.js";

/**
 * 카테고리별 시드 키워드. --seed 옵션 없이 실행할 때 기본값으로 사용된다.
 * 애드포스트 CPC가 상대적으로 높은 금융/부동산/대출/세금 관련 주제를 우선 배치했다.
 */
// 네이버 검색광고 API의 hintKeywords는 키워드 내부에 공백이 있으면 400 에러를 반환하므로
// 모두 공백 없는 붙여쓰기 형태로 둔다.
export const CATEGORY_SEEDS: Record<Category, string[]> = {
  economy: ["기준금리", "환율전망", "물가상승률", "경기침체", "금리인하"],
  "real-estate": ["전세자금대출", "청약가점", "재건축아파트", "부동산세금", "임대사업자"],
  investment: ["미국주식배당", "ETF추천", "채권투자", "퇴직연금IRP", "환테크"],
  business: ["소상공인대출", "1인사업자세금", "정부창업지원금", "간이과세자", "법인설립"],
};

export function getSeedsForCategory(category: Category): string[] {
  return CATEGORY_SEEDS[category];
}
