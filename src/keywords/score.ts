import type { CompetitionLevel, EnrichedKeyword, RawKeywordStat } from "../types.js";

const COMPETITION_WEIGHT: Record<CompetitionLevel, number> = {
  낮음: 1.0,
  중간: 0.6,
  높음: 0.3,
  알수없음: 0.5,
};

/**
 * 검색량 대비 경쟁도로 "글을 써서 상위노출될 가능성"을 점수화한다.
 * - 검색량이 너무 적으면(0) 트래픽 자체가 없으므로 감점
 * - 광고 경쟁도(compIdx)가 낮을수록 유리 (오가닉 노출 경쟁도의 대리 지표)
 * - 블로그 문서수가 확인되면, 문서량이 많을수록 감점 (이미 포화된 주제)
 */
export function computeOpportunityScore(
  stat: RawKeywordStat,
  totalSearches: number,
  blogDocCount: number | null
): number {
  if (totalSearches <= 0) return 0;

  const volumeScore = Math.log10(totalSearches + 1); // 검색량 규모를 완만하게 반영
  const competitionFactor = COMPETITION_WEIGHT[stat.competitionLevel];

  let saturationFactor = 1;
  if (blogDocCount !== null && blogDocCount > 0) {
    // 문서수가 많을수록 0에 가깝게 감쇠 (로그 스케일)
    saturationFactor = 1 / Math.log10(blogDocCount + 10);
  }

  const rawScore = volumeScore * competitionFactor * saturationFactor;
  return Math.round(rawScore * 100) / 100;
}

export function enrichKeyword(
  stat: RawKeywordStat,
  blogDocCount: number | null
): EnrichedKeyword {
  const totalMonthlySearches = stat.monthlyPcSearches + stat.monthlyMobileSearches;
  return {
    ...stat,
    totalMonthlySearches,
    blogDocCount,
    opportunityScore: computeOpportunityScore(stat, totalMonthlySearches, blogDocCount),
  };
}

export function rankByOpportunity(keywords: EnrichedKeyword[]): EnrichedKeyword[] {
  return [...keywords].sort((a, b) => b.opportunityScore - a.opportunityScore);
}
