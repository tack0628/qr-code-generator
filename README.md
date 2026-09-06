# QRつくる

URL・通常テキスト・Wi-Fi情報からQRコードを生成し、PNGまたはSVGで保存できる静的Webツールです。生成処理はすべてブラウザ内で行われ、入力内容をサーバーへ送信しません。

**公開ページ:** https://tack0628.github.io/qr-code-generator/

## 主な機能

- URL、通常テキスト、Wi-Fi情報（SSID・パスワード・暗号化方式・非公開SSID）に対応
- 入力・設定変更と同時にQRコードを更新
- 256〜2048pxの出力サイズ、余白、前景色、背景色を調整
- L / M / Q / Hのエラー訂正レベルを選択
- PNG（画像用途）とSVG（印刷・デザイン用途）で保存
- QRコードに格納する内容をワンクリックでコピー
- キーボード操作、フォーカス表示、読み上げ通知、動きを減らす設定に対応
- スマートフォンからデスクトップまでのレスポンシブ表示

## ローカル開発

Node.js 20以降とpnpmを用意し、次を実行します。

```bash
pnpm install
pnpm dev
```

## ビルド

```bash
pnpm build
pnpm preview
```

生成される`dist/`は完全な静的ファイルです。GitHub Pages、Cloudflare Pages、Netlifyなどへそのまま公開できます。Viteの`base`を相対パスに設定しているため、GitHub Pagesのリポジトリ配下でも動作します。

## GitHub Pagesへの公開

`main`ブランチへ変更を送ると、GitHub Actionsが自動でビルドし、GitHub Pagesへ公開します。設定は`.github/workflows/deploy-pages.yml`にあります。

## プライバシー

QRコード生成に利用するURL、文章、SSID、パスワードはブラウザのメモリ上だけで扱います。アプリは入力内容を保存せず、外部APIへ送信しません。

## 使用ライブラリ

- React
- Vite
- qrcode（MIT License）
