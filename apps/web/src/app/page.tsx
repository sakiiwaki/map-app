import Image from "next/image";

export default function Home() {
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold">Favorite Map App</h1>
      <p className="text-slate-600">
        マップ検索やフィルタ機能をこちらから開発していきます。
      </p>
    </section>
  );
}
