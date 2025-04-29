# RoCP Webfront - カード利用明細管理ウェブアプリケーション

このアプリケーションは、[Record of Cashless Payment](https://github.com/user/record-of-cashless-payment)のWebフロントエンドです。カード利用明細をFirestoreから取得し、カレンダー形式で表示したり分析したりするための機能を提供します。

## 機能

- Firebase Authenticationによるユーザー認証
- カレンダーベースでの利用明細表示
- 日別・週別・月別レポートの表示
- ダッシュボードによる使用状況の可視化
- Material UIを使用したレスポンシブなUIデザイン

## 技術スタック

- **フロントエンド**: React、Next.js (App Router)
- **UI**: Material UI (MUI)
- **認証**: Firebase Authentication
- **データベース**: Firebase Firestore
- **ホスティング**: Firebase App Hosting
- **その他**: TypeScript、React Big Calendar

## 前提条件

- Node.js 18.0以上
- npmまたはYarn
- Firebaseプロジェクト（バックエンドと同じもの）

## 環境構築

### 1. リポジトリのクローン

```bash
git clone https://github.com/user/record-of-cashless-payment-webfront.git
cd record-of-cashless-payment-webfront
```

### 2. 依存パッケージのインストール

```bash
npm install
# または
yarn install
```

### 3. 環境変数の設定

`.env.local.example`をコピーして`.env.local`を作成し、Firebaseの設定値を入力します：

```bash
cp .env.local.example .env.local
```

`.env.local`ファイルを編集し、FirebaseコンソールからプロジェクトIDやAPIキーなどの必要な情報を入力します。

### 4. 開発サーバーの起動

```bash
npm run dev
# または
yarn dev
```

ブラウザで[http://localhost:3000](http://localhost:3000)にアクセスすると、アプリケーションが表示されます。

## デプロイ方法

### Firebase Hostingへのデプロイ

1. Firebaseツールのインストール（初回のみ）

```bash
npm install -g firebase-tools
```

2. Firebaseへのログイン

```bash
firebase login
```

3. Firebaseプロジェクトの選択

```bash
firebase use --add
```

プロンプトが表示されたら、プロジェクトIDとエイリアス（例: production）を入力します。

4. ビルドとデプロイ

```bash
npm run build
firebase deploy --only hosting
```

デプロイが完了すると、Firebase Hostingの URL（通常は `https://your-project-id.web.app`）でアプリケーションにアクセスできます。

## プロジェクト構成

```
src/
├── app/                   # Next.js App Router
│   ├── calendar/          # カレンダーページ 
│   ├── dashboard/         # ダッシュボードページ
│   ├── login/             # ログインページ
│   ├── reports/           # レポートページ
│   └── ...
├── components/            # Reactコンポーネント
│   ├── auth/              # 認証関連コンポーネント
│   └── layout/            # レイアウトコンポーネント
├── contexts/              # Reactコンテキスト
│   ├── AuthContext.tsx    # 認証コンテキスト
│   └── ThemeContext.tsx   # テーマコンテキスト
├── hooks/                 # カスタムフック（将来追加予定）
├── lib/                   # ユーティリティライブラリ
│   └── firebase/          # Firebase関連
├── types/                 # 型定義
└── utils/                 # ユーティリティ関数（将来追加予定）
```

## バックエンドとの連携

このWebフロントエンドは、`record-of-cashless-payment`バックエンドプロジェクトとFirebase Firestoreを通じて連携します。バックエンドがメールから受信した利用明細データはFirestoreに保存され、このWebフロントエンドアプリケーションでそのデータを表示・分析します。

## 注意事項

- このアプリケーションは、同じFirebaseプロジェクトを使用しているバックエンドプロジェクトとともに使用することを想定しています
- 認証は特定のユーザーのみに制限されているため、Firebaseコンソールでのユーザー登録が必要です
