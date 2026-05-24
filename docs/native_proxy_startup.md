# Native Proxy Startup (Electron / Capacitor)

このプロジェクトの Proxy 本体は `server/createServer.ts` です。  
Web 側はすでに `http://127.0.0.1:8282` ベースの `/api-proxy` と `/companion` を使えるようにしてあります。

## Electron

Electron では Node が使えるため、メインプロセスで Proxy を直接起動できます。

```ts
// electron/main.ts
import { app, BrowserWindow } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createProxyServer } from "../server/createServer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let proxyServer: ReturnType<typeof createProxyServer> | null = null;

const startEmbeddedProxy = async () => {
  proxyServer = createProxyServer({
    companionUrl: process.env.COMPANION_URL || "https://companion.tsub4sa.xyz",
    companionSecret: process.env.COMPANION_SECRET || "",
    apiProxyUpstream: process.env.API_PROXY_UPSTREAM || "https://invidious.tsub4sa.xyz",
  });

  await proxyServer.listen({ host: "127.0.0.1", port: 8282 });
};

const createMainWindow = () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      contextIsolation: true,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    void win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    void win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
};

app.whenReady().then(async () => {
  await startEmbeddedProxy();
  createMainWindow();
});

app.on("window-all-closed", async () => {
  if (proxyServer) {
    await proxyServer.close();
    proxyServer = null;
  }
  if (process.platform !== "darwin") app.quit();
});
```

## Capacitor

Capacitor では Node.js サーバーは直接動かせません。  
このリポジトリでは Android 側に Kotlin 実装を追加済みです。

- `android/app/src/main/java/xyz/tsub4sa/invidiousclient/LocalProxyServer.kt`
- `android/app/src/main/java/xyz/tsub4sa/invidiousclient/NativeProxyPlugin.kt`
- `android/app/src/main/java/xyz/tsub4sa/invidiousclient/NativeProxyManager.kt`
- `src/lib/nativeProxy.ts`（JS 連携）

アプリ起動時に `NativeProxy.start()` が呼ばれ、`127.0.0.1:8282` で `/api-proxy` と `/companion` を提供します。

### Android (Kotlin / NanoHTTPD)

```kotlin
// android/app/src/main/java/.../LocalProxyServer.kt
class LocalProxyServer(port: Int) : NanoHTTPD("127.0.0.1", port) {
  override fun serve(session: IHTTPSession): Response {
    val uri = session.uri
    val method = session.method.name
    val target = when {
      uri.startsWith("/api-proxy") -> "https://invidious.tsub4sa.xyz" + uri.removePrefix("/api-proxy")
      uri.startsWith("/companion") -> "https://companion.tsub4sa.xyz" + uri
      else -> return newFixedLengthResponse(Response.Status.NOT_FOUND, "application/json", """{"error":"not_found"}""")
    }
    // ここで OkHttp 等で target へ転送し、ヘッダー/ボディを返す
    // /companion の場合は Authorization: Bearer <secret> を付与
    return forward(target, method, session)
  }
}
```

起動例（`MainActivity.onCreate`）:

```kotlin
private var localProxyServer: LocalProxyServer? = null

override fun onCreate(savedInstanceState: Bundle?) {
  super.onCreate(savedInstanceState)
  localProxyServer = LocalProxyServer(8282).apply { start() }
}

override fun onDestroy() {
  localProxyServer?.stop()
  super.onDestroy()
}
```

### iOS (Swift / GCDWebServer)

```swift
// ios/App/App/LocalProxyServer.swift
import GCDWebServer

final class LocalProxyServer {
  private let webServer = GCDWebServer()

  func start() throws {
    webServer.addDefaultHandler(forMethod: "GET", request: GCDWebServerRequest.self) { request in
      // request.path が /api-proxy or /companion のとき upstream へ転送
      // /companion では Authorization ヘッダを付加
      return self.forward(request: request)
    }
    try webServer.start(options: [
      GCDWebServerOption_BindToLocalhost: true,
      GCDWebServerOption_Port: 8282
    ])
  }

  func stop() {
    webServer.stop()
  }
}
```

起動例（`AppDelegate.swift`）:

```swift
let proxy = LocalProxyServer()
try? proxy.start()
```

## 補足

- Electron は `server/createServer.ts` をそのまま再利用できます。
- Capacitor はネイティブ層での forward 実装が必要です（HTTP クライアントで upstream 転送）。
- Web 側の env は `VITE_ELECTRON_LOCAL_PROXY_BASE_URL` / `VITE_CAPACITOR_LOCAL_PROXY_BASE_URL` で合わせてください。
