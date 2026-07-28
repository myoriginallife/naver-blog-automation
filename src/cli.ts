#!/usr/bin/env node
import { Command } from "commander";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { generatePostDraft } from "./content/generate.js";
import { researchKeywords } from "./keywords/research.js";
import { renderChart } from "./charts/generate.js";
import type { ChartSpec } from "./charts/types.js";
import { ensureImagesDir, writeKeywordResearch, writePostDraft } from "./output/writer.js";
import type { Category } from "./types.js";

const CATEGORIES: Category[] = ["economy", "real-estate", "investment", "business"];

function parseCategory(value: string): Category {
  if (!CATEGORIES.includes(value as Category)) {
    throw new Error(`--category는 ${CATEGORIES.join(", ")} 중 하나여야 합니다.`);
  }
  return value as Category;
}

function parseCsv(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const program = new Command();
program
  .name("nba")
  .description("네이버 블로그(경제/부동산/투자/사업) 콘텐츠 자동화 CLI");

program
  .command("keywords")
  .description("키워드 리서치: 연관 키워드 + 검색량 + 경쟁도 + 기회점수")
  .requiredOption("-c, --category <category>", `${CATEGORIES.join("|")}`)
  .option("-s, --seed <keywords>", "콤마로 구분된 시드 키워드 (미지정 시 카테고리 기본 시드 사용)")
  .option("-n, --top <n>", "출력할 상위 키워드 개수", "15")
  .action(async (opts) => {
    const category = parseCategory(opts.category);
    const seeds = parseCsv(opts.seed);
    const result = await researchKeywords({ category, seeds: seeds.length ? seeds : undefined });
    const filePath = await writeKeywordResearch(result);

    const top = Number(opts.top);
    console.log(`\n[${category}] 기회점수 상위 ${top}개 키워드\n`);
    console.log(
      "순위  키워드                         월검색량   경쟁도   블로그문서수   기회점수"
    );
    result.keywords.slice(0, top).forEach((k, i) => {
      console.log(
        `${String(i + 1).padEnd(5)} ${k.keyword.padEnd(28)} ${String(k.totalMonthlySearches).padEnd(9)} ${k.competitionLevel.padEnd(7)} ${String(k.blogDocCount ?? "-").padEnd(13)} ${k.opportunityScore}`
      );
    });
    console.log(`\n전체 결과 저장: ${filePath}`);
  });

program
  .command("draft")
  .description("Claude API로 SEO 블로그 초안 생성 (제목/메타설명/태그/본문)")
  .requiredOption("-k, --keyword <keyword>", "타깃 키워드")
  .requiredOption("-c, --category <category>", `${CATEGORIES.join("|")}`)
  .option("-r, --related <keywords>", "콤마로 구분된 연관 키워드")
  .action(async (opts) => {
    const category = parseCategory(opts.category);
    const relatedKeywords = parseCsv(opts.related);
    console.log(`"${opts.keyword}" 초안 생성 중...`);
    const draft = await generatePostDraft({ keyword: opts.keyword, category, relatedKeywords });
    const { dir, postPath } = await writePostDraft(draft);
    console.log(`\n제목: ${draft.title}`);
    console.log(`저장 위치: ${dir}`);
    console.log(`본문 파일: ${postPath}`);
    console.log(
      `\n다음 단계: 이미지가 필요하면 'npm run chart -- --slug ${draft.slug} --data <data.json>' 실행 후,\n` +
        `내용을 검토하고 네이버 블로그 편집기에 직접 붙여넣어 비공개로 저장하세요.`
    );
  });

program
  .command("chart")
  .description("사용자가 제공한 데이터로 차트 PNG 생성 (통계는 AI가 만들지 않음)")
  .requiredOption("--slug <slug>", "draft 명령이 만든 게시물 슬러그(폴더명)")
  .requiredOption("--data <path>", "차트 데이터 JSON 파일 경로 (examples/chart-data.example.json 참고)")
  .option("--out <filename>", "출력 파일명", "chart-1.png")
  .action(async (opts) => {
    const raw = await readFile(path.resolve(opts.data), "utf-8");
    const spec = JSON.parse(raw) as ChartSpec;
    const imagesDir = await ensureImagesDir(opts.slug);
    const outPath = path.join(imagesDir, opts.out);
    await renderChart(spec, outPath);
    console.log(`차트 생성 완료: ${outPath}`);
  });

program
  .command("pipeline")
  .description("키워드 리서치 후 기회점수 1위 키워드로 바로 초안까지 생성")
  .requiredOption("-c, --category <category>", `${CATEGORIES.join("|")}`)
  .option("-s, --seed <keywords>", "콤마로 구분된 시드 키워드")
  .action(async (opts) => {
    const category = parseCategory(opts.category);
    const seeds = parseCsv(opts.seed);
    console.log("키워드 리서치 중...");
    const research = await researchKeywords({ category, seeds: seeds.length ? seeds : undefined });
    await writeKeywordResearch(research);

    const best = research.keywords[0];
    if (!best) {
      console.error("연관 키워드를 찾지 못했습니다. 시드 키워드를 바꿔보세요.");
      process.exitCode = 1;
      return;
    }
    console.log(`선정된 키워드: ${best.keyword} (기회점수 ${best.opportunityScore})`);

    const related = research.keywords
      .slice(1, 6)
      .map((k) => k.keyword);

    const draft = await generatePostDraft({ keyword: best.keyword, category, relatedKeywords: related });
    const { dir, postPath } = await writePostDraft(draft);
    console.log(`\n제목: ${draft.title}`);
    console.log(`저장 위치: ${dir}`);
    console.log(`본문 파일: ${postPath}`);
  });

program.parseAsync(process.argv).catch((err) => {
  console.error(`\n오류: ${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
});
