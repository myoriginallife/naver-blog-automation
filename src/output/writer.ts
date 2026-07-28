import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Category, KeywordResearchResult, PostDraft } from "../types.js";

const OUTPUT_ROOT = path.resolve(process.cwd(), "output");

export function postDir(slug: string): string {
  return path.join(OUTPUT_ROOT, "posts", slug);
}

export interface DraftContext {
  keyword: string;
  category: Category;
}

/** draft 명령이 만든 prompt.txt와, save 명령이 참조할 키워드/카테고리를 함께 저장한다. */
export async function writePrompt(
  params: DraftContext & { slug: string; prompt: string }
): Promise<{ dir: string; promptPath: string }> {
  const dir = postDir(params.slug);
  await mkdir(dir, { recursive: true });
  const promptPath = path.join(dir, "prompt.txt");
  await writeFile(promptPath, params.prompt, "utf-8");
  await writeFile(
    path.join(dir, "context.json"),
    JSON.stringify({ keyword: params.keyword, category: params.category }, null, 2),
    "utf-8"
  );
  return { dir, promptPath };
}

export async function readDraftContext(slug: string): Promise<DraftContext> {
  const raw = await readFile(path.join(postDir(slug), "context.json"), "utf-8");
  return JSON.parse(raw) as DraftContext;
}

export function responseFilePath(slug: string): string {
  return path.join(postDir(slug), "response.txt");
}

export async function writeKeywordResearch(result: KeywordResearchResult): Promise<string> {
  const dir = path.join(OUTPUT_ROOT, "keywords");
  await mkdir(dir, { recursive: true });
  const filename = `${result.generatedAt.slice(0, 10)}_${result.category}.json`;
  const filePath = path.join(dir, filename);
  await writeFile(filePath, JSON.stringify(result, null, 2), "utf-8");
  return filePath;
}

export async function writePostDraft(draft: PostDraft): Promise<{ dir: string; postPath: string; metaPath: string }> {
  const dir = postDir(draft.slug);
  await mkdir(path.join(dir, "images"), { recursive: true });

  const postPath = path.join(dir, "post.md");
  const metaPath = path.join(dir, "meta.json");

  const markdown = [
    `# ${draft.title}`,
    "",
    `> 메타 설명: ${draft.metaDescription}`,
    `> 태그: ${draft.tags.join(", ")}`,
    "",
    draft.body,
    "",
    "---",
    draft.disclaimer,
  ].join("\n");

  await writeFile(postPath, markdown, "utf-8");
  await writeFile(metaPath, JSON.stringify(draft, null, 2), "utf-8");

  return { dir, postPath, metaPath };
}

export async function ensureImagesDir(slug: string): Promise<string> {
  const dir = path.join(postDir(slug), "images");
  await mkdir(dir, { recursive: true });
  return dir;
}
