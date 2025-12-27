import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-16">
      <div className="max-w-4xl w-full text-center space-y-8">
        {/* メインタイトル */}
        <div className="space-y-4">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight">
            <span className="bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Welcome
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 font-light">
            Path Based Multi-Tenant App
          </p>
        </div>

        {/* 説明文 */}
        <div className="max-w-2xl mx-auto space-y-4 pt-8">
          <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
            パスベースのマルチテナントアプリケーションへようこそ
          </p>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-400">
            異なるテナントをパスベースのルーティングで提供します
          </p>
        </div>

        {/* ログインボタン */}
        <div className="pt-8">
          <Link
            href="/auth/signin"
            className="inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-lg transition-colors"
          >
            サインイン
          </Link>
        </div>

        {/* 装飾的な要素 */}
        <div className="flex justify-center items-center gap-2 pt-12">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-75"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-150"></div>
        </div>
      </div>
    </div>
  );
}
