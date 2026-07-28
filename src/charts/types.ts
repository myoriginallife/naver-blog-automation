export type ChartKind = "bar" | "line" | "pie" | "doughnut";

export interface ChartDataset {
  label: string;
  data: number[];
  color?: string;
}

/**
 * 차트에 들어가는 숫자는 반드시 사용자가 직접 입력한다.
 * AI가 경제/투자 통계를 임의로 만들어내 그래프로 보여주는 것을 방지하기 위해
 * 이 스펙은 파일 입력으로만 받고, LLM이 값을 채우지 않는다.
 */
export interface ChartSpec {
  type: ChartKind;
  title: string;
  labels: string[];
  datasets: ChartDataset[];
  /** 예: "출처: 한국은행 (2026.06 기준)" — 데이터 출처를 밝혀 신뢰도와 애드포스트 정책 준수를 돕는다. */
  sourceNote?: string;
}
