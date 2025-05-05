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

#### Firebase App Hostingの環境変数（本番環境）

本番環境では、Firebase App Hostingのシークレット機能を使用して環境変数を管理しています。
`apphosting.yaml`ファイルで環境変数の設定が定義されており、実際の値は以下のコマンドでシークレットとして設定されています：

```bash
firebase apphosting:secrets:set SECRET_NAME
```

新しい環境変数を追加する場合：

1. `apphosting.yaml`ファイルに変数定義を追加
2. 上記コマンドで対応するシークレット値を設定
3. デプロイ時に自動的に環境変数が適用される

### 4. 開発サーバーの起動

```bash
npm run dev
# または
yarn dev
```

ブラウザで[http://localhost:3000](http://localhost:3000)にアクセスすると、アプリケーションが表示されます。

## デプロイ方法

### Firebase App Hostingへの自動デプロイ

このプロジェクトは、mainブランチへのコードマージ時に自動的にFirebase App Hostingへデプロイされるように設定されています。

以下のフローで自動デプロイが行われます：

1. mainブランチへのプルリクエストマージ
2. GitHub Actionsのワークフローが起動
3. ビルド処理と検証
4. Firebase App Hostingへの自動デプロイ

デプロイが完了すると、Firebase App HostingのURLでアプリケーションにアクセスできます。

#### 手動デプロイ（開発環境など）

開発環境など、特定の場合には手動でデプロイすることも可能です：

1. Firebaseツールのインストール（初回のみ）

```bash
npm install -g firebase-tools
```

2. Firebaseへのログイン

```bash
firebase login
```

3. ビルドと手動デプロイ

```bash
npm run build
firebase deploy --only hosting
```

### 注意点

- 本番環境へのデプロイは原則としてmainブランチへのマージを通じて行ってください
- テスト環境へのデプロイには、適切な環境変数設定が必要です
- デプロイ状況はGitHub Actionsのワークフロータブから確認できます

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
