# GitHub Pages での公開手順

このアプリは **フロントエンド（Next.js）** と **バックエンド（Spring Boot）** に分かれています。
GitHub Pages に置けるのはフロントエンドだけです。API は別サーバーで公開してください。

## 1. GitHub に push
このフォルダ一式を新しい GitHub リポジトリに push してください。

## 2. Secrets を設定
GitHub リポジトリの
`Settings > Secrets and variables > Actions`
で次の secret を追加します。

- `NEXT_PUBLIC_API_BASE_URL`
  - 例: `https://your-api.example.com/api`

## 3. Pages を有効化
`Settings > Pages` で Source を **GitHub Actions** にします。

## 4. main ブランチに push
`main` に push すると `.github/workflows/deploy-pages.yml` が動き、Pages にデプロイされます。

公開URLは通常:

`https://<GitHubユーザー名>.github.io/<リポジトリ名>/`

## バックエンド側で必要なこと
フロントと API が別ドメインになるため、Spring Boot 側で少なくとも次が必要です。

- CORS で GitHub Pages の URL を許可
- Cookie 認証を使うなら `Allow-Credentials: true`
- Cookie 属性を `SameSite=None; Secure` にする
- API を HTTPS で公開する

これが未設定だと、Pages 上でログインできません。
