# LoL Matchup Note

自分専用のLeague of Legends マッチアップメモ & 戦績ツール。

- チャンピオンを検索して、自チャンプ×相手チャンプ×レーン単位でマッチアップメモを書ける
- Riot ID で戦績を検索し、op.gg 風の履歴を表示
- 履歴の各試合から、その対面カードのマッチアップメモ編集画面へ直接ジャンプできる
- チャンピオンDBは Riot Data Dragon から取得してPostgres(Neon)に保存

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Riot API キーの取得(戦績検索に必要)

1. https://developer.riotgames.com/ にアクセスし、Riotアカウントでサインイン
2. Personal API Key(または Production API Key)を "Register Product" から申請してキーを取得
   - 開発用の "Development API Key" は**24時間で失効**するため、継続運用には不向き
   - Personal API Key は審査プロセス無しで取得でき、失効しない(小規模なプライベート利用向け)
3. プロジェクト直下の `.env` を開き、`RIOT_API_KEY` に貼り付け

```
RIOT_API_KEY="RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

キー未設定でもチャンプ検索・マッチアップメモ機能は使えます(サモナー検索のみキーが必要)。

### 3. DBの準備(Neon)

1. https://console.neon.tech でプロジェクトを作成
2. "Connection Details" から pooled connection と direct connection の2つの接続文字列を取得
3. `.env` に貼り付け

```
DATABASE_URL="postgresql://...-pooler.../neondb?sslmode=require"   # pooled(アプリ用)
DIRECT_URL="postgresql://.../neondb?sslmode=require"                # direct(マイグレーション用)
```

### 4. マイグレーション & チャンピオンデータのシード

```bash
npx prisma migrate deploy
npm run seed
```

`npm run seed` は Data Dragon から最新のチャンピオン一覧(日本語名込み)を取得してDBに保存します。パッチが更新されたら再実行してください。

### 5. 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 を開く。

## 使い方

- **チャンプ検索**: `/champions` でチャンピオンを検索 → 詳細ページでレーンと相手チャンプを選んで「メモを書く」→ マークダウン的なフリーテキストでメモを保存
- **サモナー検索**: `/summoner` でリージョンと Riot ID (`ゲーム名#タグ`) を入力して検索。各試合の行から、対面(同レーンの敵チャンプ)とのマッチアップメモへワンクリックで遷移

## 技術構成

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma + PostgreSQL (Neon, `@prisma/adapter-neon`)
- Riot Games API (Account-V1 / Summoner-V4 / Match-V5) をサーバー側(`/api/riot/history`)でラップし、APIキーをクライアントに露出させない構成

## 今後の拡張候補

- サモナー検索結果のキャッシュ(DBに保存してレート制限を回避)
- マッチアップメモへのタグ付け・検索
