import type { Category } from "../types.js";

/**
 * 카테고리별 시드 키워드. --seed 옵션 없이 실행할 때 기본값으로 사용된다.
 * 애드포스트 CPC가 상대적으로 높은 금융/부동산/대출/세금 관련 주제를 우선 배치했다.
 */
export const CATEGORY_SEEDS: Record<Category, string[]> = {
  economy: ["기준금리", "환율 전망", "물가상승률", "경기침체", "금리인하"],
  "real-estate": ["전세자금대출", "청약 가점", "재건축 아파트", "부동산 세금", "임대사업자"],
  investment: ["미국 주식 배당", "ETF 추천", "채권 투자", "퇴직연금 IRP", "환테크"],
  business: ["소상공인 대출", "1인 사업자 세금", "정부 창업지원금", "간이과세자", "법인 설립"],
};

export function getSeedsForCategory(category: Category): string[] {
  return CATEGORY_SEEDS[category];
}
