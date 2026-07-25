# おこづかい帳

高校生向けの、シンプルなおこづかい・買いもの管理アプリ。
スマホのブラウザで開いて、**「使ったお金の記録」→「今いくら使えるか」→「次に買いたいもの」** までを 1 画面で追えます。

- 複式簿記のような難しい概念は出てきません（1 行 = 「もらった」か「使った」だけ）
- データは**ブラウザの LocalStorage**に保存され、外部には送信されません
- ライト / ダークどちらの表示にも対応（端末の設定に追従、手動切り替えも可）
- **ホーム画面に追加すればアプリのように起動でき、電波がなくても開けます**（PWA）

## 使っている技術

| | |
|---|---|
| ビルド | Vite 8 |
| UI | React 19 + TypeScript |
| スタイル | Tailwind CSS 4（`@tailwindcss/vite` プラグイン） |
| 保存 | LocalStorage（差し替え可能な保存層ごし） |
| グラフ | 自作（依存パッケージなし） |

## 動かしかた

```bash
npm install
npm run dev      # http://localhost:5173 を開く
```

その他のコマンド:

```bash
npm run build    # 型チェック（tsc -b）+ 本番ビルド
npm run preview  # ビルド結果をローカルで確認
npm run lint     # oxlint
```

**最初にサンプルデータを入れると動きが分かりやすいです**：
アプリ右下の「設定」→「サンプルデータを入れる」。今月と先月の記録・ほしいものリストが入ります。

## 画面

| 画面 | できること |
|---|---|
| ホーム | いま使えるお金（大きい数字）、今月の予算メーター、カテゴリ別の支出割合、月ごとの収支の推移、次に買いたいもの、さいきんの記録 |
| ほしいもの | ほしいもの / 買ったものの管理。写真・リンク・メモ、貯金の進み方（あと何円で買えるか） |
| きろく | 月ごとの収支一覧（日付ごとにまとめて表示）、収入 / 支出でしぼりこみ、1 件ずつ削除 |
| 設定 | 1 か月の予算、テーマ、バックアップの書き出し / 読み込み、サンプルデータ、全消去 |

画面の下にタブバーがあり、URL のハッシュ（`#/home` `#/items` …）と連動しているので、
スマホの「戻る」ボタンでも 1 つ前のタブに戻れます。

## ディレクトリ構成

```
src/
├── types/index.ts          … アプリ全体のデータ型（Transaction / WishItem / Settings …）
├── lib/                    … React に依存しない純粋なロジック（テストしやすい層）
│   ├── categories.ts       … カテゴリ定義とカテゴリ→色の対応
│   ├── date.ts             … YYYY-MM-DD / YYYY-MM の変換・表示
│   ├── format.ts           … 「1,200円」「32%」などの表示整形
│   ├── id.ts               … id 生成
│   ├── image.ts            … 写真を 640px / JPEG 品質 0.7 に縮めて data URL 化
│   ├── registerServiceWorker.ts … PWA（本番ビルドのみ登録）
│   ├── sampleData.ts       … 動作確認用のサンプルデータ
│   ├── stats.ts            … 残高・月別集計・カテゴリ別集計・予算計算
│   └── storage.ts          … ★保存層（DataStore インターフェース + LocalStorage 実装）
├── store/
│   ├── MoneyContext.ts     … 状態と操作の型、React Context
│   ├── MoneyProvider.tsx   … 状態を持ち、変更を保存層へ書き戻す
│   └── useMoney.ts         … 画面から使う読み出しフック
├── hooks/
│   ├── useHashRoute.ts     … ハッシュだけの小さなルーター
│   ├── useLocalStorage.ts  … 単一の値を LocalStorage に残す汎用フック
│   └── useTheme.ts         … ライト / ダーク / 端末に合わせる
├── components/
│   ├── charts/             … CategoryShareChart（積み上げバー + 表）、MonthlyTrendChart、Meter
│   ├── dashboard/          … BalanceHero、MonthSwitcher
│   ├── items/              … ItemCard、ItemForm
│   ├── layout/             … AppShell、BottomNav
│   ├── transactions/       … TransactionForm、TransactionList
│   └── ui/                 … Button、Card、BottomSheet、Field、EmptyState、icons
├── pages/                  … DashboardPage / ItemsPage / HistoryPage / SettingsPage
├── App.tsx                 … ルーティングと入力シートの開閉
├── main.tsx                … エントリポイント（MoneyProvider を差し込む）
└── index.css               … Tailwind の読み込み + デザイントークン（CSS 変数）
```

## データの持ち方

```ts
// LocalStorage のキー "okozukai:data" に入る中身
{
  version: 1,
  transactions: [ { id, kind: 'income' | 'expense', amount, categoryId, date, memo?, itemId? } ],
  items:        [ { id, name, price, saved, status: 'wish' | 'bought', categoryId, imageDataUrl? } ],
  settings:     { monthlyBudget, theme }
}
```

ポイント:

- **金額は必ず正の整数**。支出をマイナスで持たず、`kind` で向きを表します
- **日付はローカルタイムの `YYYY-MM-DD` 文字列**。`new Date('2026-07-25')` は UTC 解釈で 1 日ずれるため、
  文字列 ↔ Date の変換は `lib/date.ts` の関数だけを通します
- **写真は縮小してから data URL で保存**。LocalStorage は 5MB 前後しかないため（`lib/image.ts`）
- 容量オーバー（`QuotaExceededError`）は画面上部に日本語のメッセージで出ます

## グラフの決めごと

- **カテゴリの色はカテゴリ側に固定**（`categories.ts` の `slot`）。金額順に並べ替えても色は動きません。
  月が変わるたびに「先月は青だった食費が今月はオレンジ」になると読めなくなるためです
- **積み上げバーはカテゴリ定義の順番**で描画します。並び順そのものが色の見分けやすさ
  （色覚多様性への配慮）の担保になっているため、この順番は入れ替えません
- **金額と % は必ず表（バーの下）に出します**。色だけに情報を持たせず、
  スクリーンリーダーでも読める状態を保つためです
- 予算やほしいものの進捗は、1 つの値と上限の比較なので円グラフではなく**メーター**で表します
- 月ごとの推移は、月の合計という区切られた値なので折れ線ではなく**並べた棒**にしています。
  記録がない月も 0 として横軸に残します（月を飛ばすと変化を読み間違えるため）。
  収入 / 支出には系列色（青 / オレンジ）を使い、**green / red のステータス色は系列に流用しません**
  （「良い・悪い」を表す色なので、下の合計金額の符号だけに使っています）

## PWA（ホーム画面に追加 / オフライン）

- `public/manifest.webmanifest` … アプリ名・アイコン・`display: standalone`
- `public/sw.js` … サービスワーカー。ライブラリなしの手書きで、
  ページ遷移はネット優先（新しいデプロイをすぐ拾う）、`assets/` のハッシュ付きファイルは
  キャッシュ優先、それ以外はキャッシュを返しつつ裏で更新します
- `src/lib/registerServiceWorker.ts` … **本番ビルドのみ**登録（開発中はキャッシュで混乱するため）
- アイコンは `public/icon.svg` が元データで、PNG（192 / 512 / maskable）は
  それをレンダリングして書き出したものです

オフライン動作を確認するには本番ビルドを使ってください（`npm run dev` では登録されません）:

```bash
npm run build && npm run preview
# 一度開いた後、機内モードやブラウザの Offline にしてリロードしても開きます
```

キャッシュの中身を作り直したいときは `public/sw.js` の `VERSION` を上げてください
（古いキャッシュは activate 時に削除されます）。

## これから機能を足すとき

### 保存先を Supabase などに替える

`src/lib/storage.ts` の `DataStore` インターフェースが唯一の窓口です。
画面もストアもこのインターフェースにしか依存していないので、同じ形の実装を足して
最後の 1 行を差し替えれば移行できます（メソッドは最初から `Promise` を返します）。

```ts
// src/lib/storage.ts
export const supabaseDataStore: DataStore = {
  async load() { /* select して migrate() に通す */ },
  async save(data) { /* upsert */ },
  async clear() { /* delete */ },
}

export const dataStore: DataStore = supabaseDataStore // ← ここだけ差し替える
```

保存する形が変わったら `CURRENT_VERSION` を上げて、`migrate()` に変換を書き足してください。

### カテゴリを増やす / 名前を変える

`src/lib/categories.ts` の配列に足すだけです。支出カテゴリは `slot`（1〜7 か `'other'`）で色が決まります。
色を増やしたい場合は `src/index.css` の `--series-N` をライト / ダーク両方に足してください
（8 色を超える場合は、色を増やすのではなく「その他」にまとめるのが読みやすいです）。

### 表示テーマの色を変える

`src/index.css` の `:root` と `:root[data-theme='dark']` の CSS 変数がすべての色の出どころです。
Tailwind 側には `@theme inline` で公開しているので、`bg-surface-1` `text-ink-2` などのクラス名は変えずに配色だけ差し替えられます。
