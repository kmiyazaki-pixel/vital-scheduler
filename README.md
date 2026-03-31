# VitalArea Scheduler

今の単体 HTML を、**Next.js + Spring Boot + PostgreSQL** 構成へ移したスターター兼、かなり動く初期版です。

## 今回ここまで入れたもの

### frontend (Next.js)
- ログイン画面
- セッション前提の認証確認
- 月表示
- 週表示
- カレンダー切替
- 予定の追加 / 編集 / 削除モーダル
- 月移動 / 週移動 / 今日ボタン
- 管理者向けユーザー管理画面の土台

### backend (Spring Boot)
- セッションログイン
- `/api/auth/login`
- `/api/auth/logout`
- `/api/me`
- `/api/users` 一覧 / 作成 / 更新 / 有効無効切替
- `/api/calendars`
- `/api/calendars/{calendarId}/events`
- `/api/events` 作成 / 更新 / 削除
- Spring Security
- Flyway 初期マイグレーション
- JPA Entity / Repository / Service / Controller

### database (PostgreSQL)
- departments
- users
- calendars
- events
- seed データ投入

## 初期ログイン
- メール: `yamada@vital-area.co.jp`
- パスワード: `password`

## ディレクトリ

```text
vital-scheduler/
  frontend/   # Next.js
  backend/    # Spring Boot
  docker-compose.yml
```

## 起動方法

### 1. Docker Compose ですべて起動

```bash
docker compose up --build
```

### 2. 個別起動する場合

#### DB
```bash
docker compose up -d db
```

#### backend
```bash
cd backend
mvn spring-boot:run
```

#### frontend
```bash
cd frontend
npm install
npm run dev
```

## URL
- frontend: `http://localhost:3000`
- backend: `http://localhost:8080`

## 補足
- フロントは `credentials: include` で Spring Boot のセッションCookieを使います。
- 初期版として CSRF は無効化しています。社内本番前には有効化推奨です。
- 権限は `admin / manager / member / viewer` を想定していますが、画面側はまだ主に admin 用を先に実装しています。

## まだ残っているもの
- `calendar_members` による共有メンバー単位の権限管理
- 監査ログ
- 管理画面でのユーザー更新フォーム
- 部署 / カレンダー管理画面
- Nginx を含めた本番デプロイ定義
- Spring Security の CSRF 本格対応

## 本番URLの想定
推奨は次です。

- `https://scheduler.vital-area.co.jp/`

フロントとAPIを Nginx で同一ドメイン配下に寄せる構成が扱いやすいです。
