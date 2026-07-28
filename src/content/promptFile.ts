import type { Category } from "../types.js";
import { buildSystemPrompt, buildUserPrompt } from "./prompts.js";

const OUTPUT_FORMAT = `아래 형식을 정확히 그대로 지켜서 답변하세요. 마커 줄(===TITLE=== 등)은 절대
수정하거나 생략하지 마세요. 마커 앞뒤로 다른 설명, 인사말, 마크다운 코드블록(\`\`\`)을 덧붙이지 마세요.

===TITLE===
(SEO 제목, 25~40자)
===META===
(검색결과용 메타 설명, 70~110자)
===TAGS===
(태그를 쉼표로 구분해서 한 줄로: 태그1, 태그2, 태그3)
===DISCLAIMER===
(투자 조언이 아니라는 안내 문구 한 줄)
===BODY===
(## 소제목을 포함한 본문 전체)
===END===`;

/**
 * Claude API를 호출하지 않고, claude.ai 채팅 등에 수동으로 붙여넣을 프롬프트 전문을 만든다.
 */
export function buildFullPrompt(params: {
  keyword: string;
  category: Category;
  relatedKeywords: string[];
}): string {
  return [
    "# 역할",
    buildSystemPrompt(),
    "",
    "# 요청",
    buildUserPrompt(params),
    "",
    "# 출력 형식",
    OUTPUT_FORMAT,
  ].join("\n");
}
