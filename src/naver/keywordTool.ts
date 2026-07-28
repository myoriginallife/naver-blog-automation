import { config } from "../config.js";
import type { CompetitionLevel, RawKeywordStat } from "../types.js";
import { buildAuthHeaders } from "./signature.js";

const HOST = "https://api.naver.com";
const PATH = "/keywordstool";

interface NaverKeywordRow {
  relKeyword: string;
  monthlyPcQcCnt: number | string;
  monthlyMobileQcCnt: number | string;
  monthlyAvePcClkCnt?: number | string;
  monthlyAveMobileClkCnt?: number | string;
  compIdx: string;
}

interface NaverKeywordToolResponse {
  keywordList: NaverKeywordRow[];
}

function parseCount(value: number | string | undefined): number {
  if (value === undefined) return 0;
  if (typeof value === "number") return value;
  // 네이버는 검색량이 매우 낮을 경우 "< 10" 같은 문자열을 반환한다.
  const digits = value.replace(/[^0-9]/g, "");
  if (digits.length === 0) return 5; // "< 10" 등 -> 대략치로 처리
  return Number(digits);
}

function parseCompetition(value: string | undefined): CompetitionLevel {
  if (value === "낮음" || value === "중간" || value === "높음") return value;
  return "알수없음";
}

/**
 * 네이버 검색광고 키워드 도구로 연관 키워드와 월간 검색량/경쟁도를 조회한다.
 * hintKeywords는 최대 5개까지 콤마로 전달 가능.
 */
export async function fetchRelatedKeywords(
  hintKeywords: string[]
): Promise<RawKeywordStat[]> {
  // 네이버 검색광고 API는 키워드 내부에 공백이 있으면 400(hintKeywords 파라미터가
  // 유효하지 않습니다)을 반환하므로, 사용자가 --seed에 공백 섞인 키워드를 넣어도 방어한다.
  const seeds = hintKeywords.map((k) => k.replace(/\s+/g, "")).filter(Boolean).slice(0, 5);
  const query = new URLSearchParams({
    hintKeywords: seeds.join(","),
    showDetail: "1",
  });

  const headers = buildAuthHeaders({
    method: "GET",
    path: PATH,
    apiKey: config.naverAd.apiKey,
    secretKey: config.naverAd.secretKey,
    customerId: config.naverAd.customerId,
  });

  const res = await fetch(`${HOST}${PATH}?${query.toString()}`, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `네이버 검색광고 API 요청 실패 (${res.status}): ${text.slice(0, 500)}`
    );
  }

  const data = (await res.json()) as NaverKeywordToolResponse;

  return data.keywordList.map((row) => ({
    keyword: row.relKeyword,
    monthlyPcSearches: parseCount(row.monthlyPcQcCnt),
    monthlyMobileSearches: parseCount(row.monthlyMobileQcCnt),
    competitionLevel: parseCompetition(row.compIdx),
    avgMonthlyAdImpressions:
      parseCount(row.monthlyAvePcClkCnt) + parseCount(row.monthlyAveMobileClkCnt),
  }));
}
