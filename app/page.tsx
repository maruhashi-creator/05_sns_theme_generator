"use client";

import { useState, useEffect } from "react";
import { CATEGORIES, NG_WORDS, type Category } from "@/lib/prompt";

const STORAGE_KEY = "adoptedThemes_v1";

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [pastThemes, setPastThemes] = useState("");
  const [adopted, setAdopted] = useState<Set<string>>(new Set());
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const list = JSON.parse(raw) as string[];
        setAdopted(new Set(list));
        setPastThemes(list.join("\n"));
      }
    } catch {}
  }, []);

  const persistAdopted = (next: Set<string>) => {
    setAdopted(next);
    const list = Array.from(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {}
    setPastThemes(list.join("\n"));
  };

  const toggleCategory = (c: Category) => {
    setCategories((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const generate = async () => {
    setLoading(true);
    setResult("");
    setError("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories, pastThemes: pastThemes.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "エラーが発生しました");
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("ストリーム取得に失敗");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setResult((prev) => prev + decoder.decode(value));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "不明なエラー");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generate();
  };

  const allThemes = result
    .split("\n")
    .filter((l) => /^\d+\./.test(l.trim()))
    .map((l) => l.replace(/^\d+\.\s*/, "").trim())
    .filter((l) => l.length > 0);

  const filtered = allThemes.filter(
    (t) => !NG_WORDS.some((ng) => t.includes(ng))
  );
  const filteredCount = allThemes.length - filtered.length;

  const toggleAdopt = (theme: string) => {
    const next = new Set(adopted);
    if (next.has(theme)) next.delete(theme);
    else next.add(theme);
    persistAdopted(next);
  };

  const copyOne = async (theme: string) => {
    await navigator.clipboard.writeText(theme);
    setCopied(theme);
    setTimeout(() => setCopied(null), 1500);
  };

  const copyAll = async () => {
    if (filtered.length === 0) return;
    const text = filtered.map((t, i) => `${i + 1}. ${t}`).join("\n");
    await navigator.clipboard.writeText(text);
    setCopied("__all__");
    setTimeout(() => setCopied(null), 1500);
  };

  const clearHistory = () => {
    if (!confirm("採用テーマ履歴をすべて削除しますか？")) return;
    persistAdopted(new Set());
  };

  return (
    <main className="min-h-screen bg-canvas py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-ink">
            投稿テーマジェネレータくん
          </h1>
          <p className="text-stone-500">
            Instagram投稿テーマを10案提案します
          </p>
        </header>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-ink">
                カテゴリ（複数選択可・未選択なら全カテゴリから）
              </label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((c) => {
                  const active = categories.includes(c.value);
                  return (
                    <button
                      type="button"
                      key={c.value}
                      onClick={() => toggleCategory(c.value)}
                      disabled={loading}
                      className={`px-3 py-2 rounded-xl text-sm border transition-colors cursor-pointer ${
                        active
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-ink border-stone-200 hover:border-stone-300"
                      }`}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 px-4"
            >
              {loading ? "生成中..." : "10案を生成する"}
            </button>
          </form>
        </div>

        {error && (
          <div className="card p-4 border-red-200 bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        {(filtered.length > 0 || loading) && (
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-stone-500">
                テーマ候補{filtered.length > 0 ? `（${filtered.length}案）` : ""}
                {filteredCount > 0 && (
                  <span className="ml-2 text-xs text-stone-400">
                    （{filteredCount}件は表示から除外）
                  </span>
                )}
              </h2>
              {filtered.length > 0 && (
                <button
                  onClick={copyAll}
                  className="text-xs text-primary hover:text-primary-hover font-medium cursor-pointer"
                >
                  {copied === "__all__" ? "コピーしました" : "すべてコピー"}
                </button>
              )}
            </div>

            <ol className="space-y-3">
              {filtered.map((theme, i) => {
                const isAdopted = adopted.has(theme);
                return (
                  <li key={i} className="flex gap-3 items-start group">
                    <label className="flex items-center pt-0.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAdopted}
                        onChange={() => toggleAdopt(theme)}
                        className="accent-primary w-4 h-4"
                        title="採用したらチェック（次回の重複回避に使われます）"
                      />
                    </label>
                    <span className="text-primary font-bold text-sm w-5 shrink-0 pt-0.5">
                      {i + 1}
                    </span>
                    <button
                      onClick={() => copyOne(theme)}
                      className={`text-left leading-relaxed transition-colors flex-1 cursor-pointer ${
                        isAdopted
                          ? "text-stone-400 line-through"
                          : "text-ink hover:text-primary"
                      }`}
                      title="クリックでコピー"
                    >
                      {theme}
                      {copied === theme && (
                        <span className="ml-2 text-xs text-primary">
                          ✓ コピー
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
              {loading && (
                <li className="text-stone-400 text-sm animate-pulse">生成中...</li>
              )}
            </ol>

            {!loading && filtered.length > 0 && (
              <button
                onClick={generate}
                className="btn-primary w-full py-3 px-4"
              >
                もう10案を生成する
              </button>
            )}
          </div>
        )}

        <div className="card p-6 space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="pastThemes" className="block text-sm font-medium text-ink">
              過去に使ったテーマ（任意・重複回避）
            </label>
            {adopted.size > 0 && (
              <button
                type="button"
                onClick={clearHistory}
                className="text-xs text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                履歴をクリア
              </button>
            )}
          </div>
          <textarea
            id="pastThemes"
            className="input resize-none"
            placeholder="採用したテーマを下のチェックで保存すると、次回ここに自動入力されます"
            value={pastThemes}
            onChange={(e) => setPastThemes(e.target.value)}
            rows={4}
            maxLength={3000}
            disabled={loading}
          />
          <p className="text-xs text-stone-400 text-right">
            {pastThemes.length} / 3000
          </p>
        </div>

        <footer className="text-center text-xs text-stone-400 pt-4">
          Powered by Vercel AI SDK · 切り替えは .env.local の AI_PROVIDER で
        </footer>
      </div>
    </main>
  );
}
