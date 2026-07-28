export type Category = "economy" | "real-estate" | "investment" | "business";

export const CATEGORY_LABELS: Record<Category, string> = {
  economy: "경제",
  "real-estate": "부동산",
  investment: "투자",
  business: "사업",
};

export type CompetitionLevel = "낮음" | "중간" | "높음" | "알수없음";

export interface RawKeywordStat {
  keyword: string;
  monthlyPcSearches: number;
  monthlyMobileSearches: number;
  competitionLevel: CompetitionLevel;
  avgMonthlyAdImpressions: number;
}

export interface EnrichedKeyword extends RawKeywordStat {
  totalMonthlySearches: number;
  blogDocCount: number | null;
  opportunityScore: number;
}

export interface KeywordResearchResult {
  category: Category;
  seedKeywords: string[];
  generatedAt: string;
  keywords: EnrichedKeyword[];
}

export interface PostDraft {
  keyword: string;
  category: Category;
  slug: string;
  title: string;
  metaDescription: string;
  tags: string[];
  body: string;
  disclaimer: string;
  generatedAt: string;
  model: string;
}
