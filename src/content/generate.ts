import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config.js";
import type { Category, PostDraft } from "../types.js";
import { slugify } from "../util/slug.js";
import { buildSystemPrompt, buildUserPrompt } from "./prompts.js";

const SAVE_POST_DRAFT_TOOL: Anthropic.Tool = {
  name: "save_post_draft",
  description: "완성된 블로그 초안을 구조화된 형식으로 저장합니다.",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string", description: "SEO 최적화된 제목 (25~40자 권장)" },
      metaDescription: { type: "string", description: "검색결과용 요약 설명 (70~110자)" },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "네이버 블로그 태그 5~10개",
      },
      body: {
        type: "string",
        description: "## 소제목을 포함한 본문 전체 (마크다운 스타일 소제목 사용)",
      },
      disclaimer: {
        type: "string",
        description: "투자 조언이 아니라는 안내 문구 (본문에 이미 녹였다면 짧게)",
      },
    },
    required: ["title", "metaDescription", "tags", "body", "disclaimer"],
  },
};

export async function generatePostDraft(params: {
  keyword: string;
  category: Category;
  relatedKeywords?: string[];
}): Promise<PostDraft> {
  const client = new Anthropic({ apiKey: config.anthropic.apiKey });

  const response = await client.messages.create({
    model: config.anthropic.model,
    max_tokens: 4096,
    system: buildSystemPrompt(),
    tools: [SAVE_POST_DRAFT_TOOL],
    tool_choice: { type: "tool", name: "save_post_draft" },
    messages: [
      {
        role: "user",
        content: buildUserPrompt({
          keyword: params.keyword,
          category: params.category,
          relatedKeywords: params.relatedKeywords ?? [],
        }),
      },
    ],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );
  if (!toolUse) {
    throw new Error("Claude가 save_post_draft 도구를 호출하지 않았습니다. 응답을 확인하세요.");
  }

  const input = toolUse.input as {
    title: string;
    metaDescription: string;
    tags: string[];
    body: string;
    disclaimer: string;
  };

  return {
    keyword: params.keyword,
    category: params.category,
    slug: slugify(params.keyword),
    title: input.title,
    metaDescription: input.metaDescription,
    tags: input.tags,
    body: input.body,
    disclaimer: input.disclaimer,
    generatedAt: new Date().toISOString(),
    model: config.anthropic.model,
  };
}
