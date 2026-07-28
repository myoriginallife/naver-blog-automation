import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { writeFile } from "node:fs/promises";
import type { ChartSpec } from "./types.js";

const PALETTE = [
  "#2563eb", // blue
  "#16a34a", // green
  "#f59e0b", // amber
  "#dc2626", // red
  "#7c3aed", // violet
  "#0891b2", // cyan
];

const WIDTH = 1200;
const HEIGHT = 675;

export async function renderChart(spec: ChartSpec, outPath: string): Promise<void> {
  const canvas = new ChartJSNodeCanvas({
    width: WIDTH,
    height: HEIGHT,
    backgroundColour: "white",
    chartCallback: (ChartJS: any) => {
      // chart.js의 CJS 빌드는 `registerables` 번들을 내보내지 않고, chartjs-node-canvas가
      // 넘겨주는 인스턴스의 타입 선언도 등록 가능한 컴포넌트들을 포함하지 않으므로 any로 받는다.
      // chartjs-node-canvas가 내부에서 사용하는 것과 동일한 ChartJS 인스턴스에서
      // 필요한 컨트롤러/엘리먼트/플러그인을 직접 등록한다.
      ChartJS.register(
        ChartJS.BarController,
        ChartJS.BarElement,
        ChartJS.LineController,
        ChartJS.LineElement,
        ChartJS.PointElement,
        ChartJS.PieController,
        ChartJS.DoughnutController,
        ChartJS.ArcElement,
        ChartJS.CategoryScale,
        ChartJS.LinearScale,
        ChartJS.Legend,
        ChartJS.Title,
        ChartJS.Tooltip,
        ChartJS.SubTitle,
        ChartJS.Filler
      );
    },
  });

  const isPieLike = spec.type === "pie" || spec.type === "doughnut";

  const chartConfig = {
    type: spec.type,
    data: {
      labels: spec.labels,
      datasets: spec.datasets.map((ds, i) => ({
        label: ds.label,
        data: ds.data,
        backgroundColor: isPieLike
          ? spec.labels.map((_, j) => PALETTE[j % PALETTE.length])
          : ds.color ?? PALETTE[i % PALETTE.length],
        borderColor: ds.color ?? PALETTE[i % PALETTE.length],
        borderWidth: spec.type === "line" ? 2 : 1,
      })),
    },
    options: {
      responsive: false,
      plugins: {
        title: { display: true, text: spec.title, font: { size: 22 } },
        subtitle: spec.sourceNote
          ? { display: true, text: spec.sourceNote, font: { size: 13, style: "italic" } }
          : undefined,
        legend: { display: spec.datasets.length > 1 || isPieLike },
      },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  const buffer = await canvas.renderToBuffer(chartConfig);

  await writeFile(outPath, buffer);
}
