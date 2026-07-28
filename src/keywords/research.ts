import { fetchBlogDocCount } from "../naver/blogSearch.js";
import { fetchRelatedKeywords } from "../naver/keywordTool.js";
import type { Category, KeywordResearchResult } from "../types.js";
import { enrichKeyword, rankByOpportunity } from "./score.js";
import { getSeedsForCategory } from "./seeds.js";

export interface ResearchOptions {
  category: Category;
  seeds?: string[];
  /** 블로그 문서수(경쟁도) 조회를 상위 몇 개 키워드까지 할지. API 호출 비용을 줄이기 위해 제한. */
  docCountLimit?: number;
}

export async function researchKeywords(
  options: ResearchOptions
): Promise<KeywordResearchResult> {
  const seedKeywords = options.seeds?.length ? options.seeds : getSeedsForCategory(options.category);
  const docCountLimit = options.docCountLimit ?? 20;

  const rawStats = await fetchRelatedKeywords(seedKeywords);

  // 검색량 기준으로 1차 정렬 후, 상위 N개만 블로그 문서수(경쟁도) API를 호출한다.
  const byVolume = [...rawStats].sort(
    (a, b) =>
      b.monthlyPcSearches + b.monthlyMobileSearches - (a.monthlyPcSearches + a.monthlyMobileSearches)
  );
  const toEnrichWithDocCount = new Set(byVolume.slice(0, docCountLimit).map((k) => k.keyword));

  const enriched = await Promise.all(
    rawStats.map(async (stat) => {
      const blogDocCount = toEnrichWithDocCount.has(stat.keyword)
        ? await fetchBlogDocCount(stat.keyword)
        : null;
      return enrichKeyword(stat, blogDocCount);
    })
  );

  return {
    category: options.category,
    seedKeywords,
    generatedAt: new Date().toISOString(),
    keywords: rankByOpportunity(enriched),
  };
}
