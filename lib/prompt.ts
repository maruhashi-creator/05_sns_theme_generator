export type Category =
  | "emotion"
  | "daily"
  | "relationship"
  | "selfcare"
  | "work"
  | "rest";

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: "emotion", label: "感情" },
  { value: "daily", label: "日常生活" },
  { value: "relationship", label: "対人関係" },
  { value: "selfcare", label: "セルフケア" },
  { value: "work", label: "仕事" },
  { value: "rest", label: "休息" },
];

const CATEGORY_LABEL: Record<Category, string> = {
  emotion: "感情",
  daily: "日常生活",
  relationship: "対人関係",
  selfcare: "セルフケア",
  work: "仕事",
  rest: "休息",
};

export const NG_WORDS = [
  "死",
  "死にたい",
  "消えたい",
  "終わりにしたい",
  "自殺",
  "リストカット",
  "リスカ",
];

export const SYSTEM_PROMPT = `あなたはInstagramアカウント @tech.expert.takatsuki の投稿テーマを考えるアシスタントです。

このアカウントは、精神疾患を持つ方に寄り添う発信をしています。「こんな時はどうしてる？」というテーマに対し、当事者（就労移行支援事業所の利用者）が回答していくスタイルです。

【テーマの作り方】
以下7スタイルをバランスよく混ぜて、毎回バリエーションを出してください。

1. 〜なあなたへ系 — 例:「人に頼るのが苦手な、あなたへ」
2. どうしてる？系 — 例:「罪悪感、どうしてる？」
3. 〜な時の〜系 — 例:「朝、エンジンがかからない時のスイッチ」
4. 気づき系 — 例:「自分のペースでいい、って気づいた瞬間」
5. 日常シェア系 — 例:「久しぶりに外に出られた日のこと」
6. 実用Tips系 — 例:「薬を飲み忘れないための、私のルーティン」
7. 参加招待系 — 例:「毎日が変わる"セルフケア"始めてみませんか？」

【ルール】
- 必ず10案、番号付き（1.〜10.）で出力する
- 1案あたり20文字以上24文字以内
- やわらかく、寄り添うトーン
- 一行に1テーマ。前置き・後書き・解説は一切書かない

出力フォーマット:
1. テーマ
2. テーマ
...
10. テーマ`;

export function buildUserPrompt(
  categories: Category[],
  pastThemes: string
): string {
  const categoryText =
    categories.length > 0
      ? categories.map((c) => CATEGORY_LABEL[c]).join("、")
      : "感情、日常生活、対人関係、セルフケア、仕事、休息（全カテゴリから自由に）";

  let prompt = `カテゴリ: ${categoryText}\n\n上記カテゴリから10案考えてください。`;

  if (pastThemes.trim()) {
    prompt += `\n\n【過去に使ったテーマ（被らないようにしてください）】\n${pastThemes.trim()}`;
  }

  return prompt;
}

export function filterNgThemes(themes: string[]): string[] {
  return themes.filter(
    (theme) => !NG_WORDS.some((ng) => theme.includes(ng))
  );
}
