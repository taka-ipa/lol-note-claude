import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">LoL Matchup Note</h1>
        <p className="mt-2 text-neutral-400">
          自分のマッチアップメモと戦績を一箇所に。
        </p>
      </div>
      <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/champions"
          className="group rounded-xl border border-neutral-800 bg-neutral-900 p-6 transition hover:border-sky-500 hover:bg-neutral-800"
        >
          <h2 className="text-lg font-semibold text-white group-hover:text-sky-400">
            チャンプ検索
          </h2>
          <p className="mt-2 text-sm text-neutral-400">
            チャンピオンごとのマッチアップメモを見る・書く
          </p>
        </Link>
        <Link
          href="/summoner"
          className="group rounded-xl border border-neutral-800 bg-neutral-900 p-6 transition hover:border-sky-500 hover:bg-neutral-800"
        >
          <h2 className="text-lg font-semibold text-white group-hover:text-sky-400">
            サモナー検索
          </h2>
          <p className="mt-2 text-sm text-neutral-400">
            戦績を取得して、そこからマッチアップメモへジャンプ
          </p>
        </Link>
      </div>
    </div>
  );
}
