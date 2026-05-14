# 実装計画: 開発サーバーのホスト設定

## 修正内容
`vite.config.ts` の `defineConfig` に以下の設定を追加する。

```typescript
server: {
  host: true, // 全てのネットワークインターフェース（0.0.0.0）でリッスン
  port: 5173, // ポート番号を 5173 に固定
}
```

## 期待される結果
`npm run dev` 実行時に、`Network: http://<LAN_IP>:5173/` のように表示され、同じネットワーク内のスマートフォンや他の PC からアクセス可能になる。
