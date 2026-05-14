import Fastify from "fastify";
import cors from "@fastify/cors";
import proxy from "@fastify/http-proxy";
import * as dotenv from "dotenv";

dotenv.config();

const fastify = Fastify({
  logger: true,
});

const COMPANION_URL = process.env.COMPANION_URL || "https://companion.tsub4sa.xyz";
const COMPANION_SECRET = process.env.COMPANION_SECRET || "";
const PORT = Number(process.env.PORT) || 8282;

// CORS を有効化（フロントエンドからのリクエストを許可）
fastify.register(cors, {
  origin: true,
});

// Invidious Companion へのプロキシ設定
// フロントエンドは http://localhost:8282/companion/... にリクエストを送る
fastify.register(proxy, {
  upstream: COMPANION_URL,
  prefix: "/companion",
  rewritePrefix: "/companion",
  replyOptions: {
    rewriteRequestHeaders: (request, headers) => {
      if (COMPANION_SECRET) {
        return {
          ...headers,
          authorization: `Bearer ${COMPANION_SECRET}`,
        };
      }
      return headers;
    },
  },
});

fastify.get("/health", async () => {
  return { status: "ok" };
});

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: "0.0.0.0" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
