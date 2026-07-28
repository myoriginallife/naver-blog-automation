/** 한글 키워드를 파일/폴더명으로 쓸 수 있는 슬러그로 변환한다 (한글은 보존, 공백만 치환). */
export function slugify(input: string): string {
  const trimmed = input.trim().replace(/\s+/g, "-");
  const safe = trimmed.replace(/[\\/:*?"<>|]/g, "");
  const stamp = new Date().toISOString().slice(0, 10);
  return `${stamp}_${safe}`;
}
