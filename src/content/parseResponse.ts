export interface ParsedDraftSections {
  title: string;
  metaDescription: string;
  tags: string[];
  disclaimer: string;
  body: string;
}

const MARKER_RE = /^===([A-Z]+)===\s*$/;
const DEFAULT_DISCLAIMER =
  "본 글은 정보 제공을 목적으로 하며 투자 조언이 아닙니다. 투자 판단과 책임은 본인에게 있습니다.";

/**
 * claude.ai 채팅 등에서 받은 답변을 붙여넣은 텍스트를 파싱한다.
 * 형식은 promptFile.ts의 OUTPUT_FORMAT과 짝을 이룬다.
 */
export function parseManualResponse(raw: string): ParsedDraftSections {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const sections: Record<string, string[]> = {};
  let current: string | null = null;

  for (const line of lines) {
    const match = line.match(MARKER_RE);
    if (match) {
      const key = match[1];
      if (key === "END") {
        current = null;
        continue;
      }
      current = key;
      sections[current] = [];
      continue;
    }
    if (current) sections[current].push(line);
  }

  const get = (key: string) => (sections[key] ?? []).join("\n").trim();

  const title = get("TITLE");
  const body = get("BODY");

  if (!title || !body) {
    throw new Error(
      "응답에서 ===TITLE=== / ===BODY=== 섹션을 찾지 못했습니다. " +
        "prompt.txt에 안내된 출력 형식 그대로 붙여넣었는지 확인하세요 (마커 줄이 정확히 있어야 합니다)."
    );
  }

  const tagsLine = get("TAGS");
  const tags = tagsLine
    ? tagsLine
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  return {
    title,
    metaDescription: get("META"),
    tags,
    disclaimer: get("DISCLAIMER") || DEFAULT_DISCLAIMER,
    body,
  };
}
