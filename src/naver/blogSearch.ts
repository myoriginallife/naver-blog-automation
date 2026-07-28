import { config } from "../config.js";

const ENDPOINT = "https://openapi.naver.com/v1/search/blog.json";

/**
 * 네이버 오픈API(블로그 검색)로 키워드에 대한 기존 게시물 총량을 조회한다.
 * 값이 클수록 이미 콘텐츠가 많이 쌓인(경쟁이 심한) 키워드라는 뜻이다.
 * 클라이언트 ID/Secret이 설정되지 않았으면 null을 반환하고 조용히 건너뛴다.
 */
export async function fetchBlogDocCount(keyword: string): Promise<number | null> {
  if (!config.naverOpenApi.isConfigured) return null;

  const query = new URLSearchParams({ query: keyword, display: "1" });
  const res = await fetch(`${ENDPOINT}?${query.toString()}`, {
    headers: {
      "X-Naver-Client-Id": config.naverOpenApi.clientId!,
      "X-Naver-Client-Secret": config.naverOpenApi.clientSecret!,
    },
  });

  if (!res.ok) {
    return null;
  }

  const data = (await res.json()) as { total: number };
  return data.total;
}
