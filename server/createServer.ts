import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import proxy from "@fastify/http-proxy";
import { randomUUID } from "node:crypto";

export type ProxyServerConfig = {
  companionUrl: string;
  companionSecret: string;
  apiProxyUpstream: string;
};
type YoutubeJsProxyQuery = { url?: string };

type TvCommand = {
  id: string;
  videoId: string;
  sentAt: number;
};

type TvSession = {
  id: string;
  createdAt: number;
  updatedAt: number;
  lastCommand: TvCommand | null;
};

const SESSION_TTL_MS = 1000 * 60 * 60 * 6;

export const createProxyServer = (config: ProxyServerConfig): FastifyInstance => {
  const fastify = Fastify({ logger: true });
  const tvSessions = new Map<string, TvSession>();

  const cleanupExpiredSessions = () => {
    const now = Date.now();
    for (const [sessionId, session] of tvSessions.entries()) {
      if (now - session.updatedAt > SESSION_TTL_MS) {
        tvSessions.delete(sessionId);
      }
    }
  };

  const createTvSession = () => {
    cleanupExpiredSessions();
    const sessionId = randomUUID();
    const now = Date.now();
    const session: TvSession = {
      id: sessionId,
      createdAt: now,
      updatedAt: now,
      lastCommand: null,
    };
    tvSessions.set(sessionId, session);
    return { sessionId, expiresInMs: SESSION_TTL_MS };
  };

  fastify.register(cors, { origin: true });

  fastify.register(proxy, {
    upstream: config.companionUrl,
    prefix: "/companion",
    rewritePrefix: "/companion",
    replyOptions: {
      rewriteRequestHeaders: (_request, headers) => {
        if (config.companionSecret) {
          return {
            ...headers,
            authorization: `Bearer ${config.companionSecret}`,
          };
        }
        return headers;
      },
    },
  });

  fastify.register(proxy, {
    upstream: config.apiProxyUpstream,
    prefix: "/api-proxy",
    rewritePrefix: "",
  });

  fastify.all<{ Querystring: YoutubeJsProxyQuery }>("/youtubejs-proxy", async (request, reply) => {
    const target = String(request.query.url || "").trim();
    if (!target) return reply.code(400).send({ error: "url_required" });

    let parsed: URL;
    try {
      parsed = new URL(target);
    } catch {
      return reply.code(400).send({ error: "invalid_url" });
    }
    if (parsed.protocol !== "https:") return reply.code(400).send({ error: "https_only" });

    const buildForwardBody = (): BodyInit | undefined => {
      if (request.method === "GET" || request.method === "HEAD") return undefined;
      const body = request.body as unknown;
      if (body == null) return undefined;
      if (typeof body === "string" || body instanceof Uint8Array || body instanceof ArrayBuffer) return body as BodyInit;
      return JSON.stringify(body);
    };

    const reqHeaders = new Headers();
    const proxyCookie = typeof request.headers["x-ytjs-cookie"] === "string"
      ? request.headers["x-ytjs-cookie"].trim()
      : "";
    for (const [key, value] of Object.entries(request.headers)) {
      if (!value) continue;
      const lower = key.toLowerCase();
      if (
        lower === "host" ||
        lower === "content-length" ||
        lower === "transfer-encoding" ||
        lower === "connection" ||
        lower === "keep-alive" ||
        lower === "proxy-connection" ||
        lower === "upgrade" ||
        lower === "te" ||
        lower === "trailer" ||
        lower === "x-ytjs-cookie"
      ) continue;
      if (Array.isArray(value)) {
        reqHeaders.set(key, value.join(", "));
      } else {
        reqHeaders.set(key, value);
      }
    }
    if (proxyCookie) reqHeaders.set("cookie", proxyCookie);

    let upstreamResponse: Response;
    try {
      upstreamResponse = await fetch(parsed, {
        method: request.method,
        headers: reqHeaders,
        body: buildForwardBody(),
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(502).send({ error: "upstream_fetch_failed" });
    }

    for (const [key, value] of upstreamResponse.headers.entries()) {
      const lower = key.toLowerCase();
      if (
        lower === "connection" ||
        lower === "transfer-encoding" ||
        lower === "keep-alive" ||
        lower === "proxy-authenticate" ||
        lower === "proxy-authorization" ||
        lower === "te" ||
        lower === "trailer" ||
        lower === "upgrade" ||
        lower === "content-length"
      ) continue;
      reply.header(key, value);
    }
    reply.code(upstreamResponse.status);
    const bodyBuffer = Buffer.from(await upstreamResponse.arrayBuffer());
    return reply.send(bodyBuffer);
  });

  fastify.get("/health", async () => ({ status: "ok" }));
  fastify.post("/tv-sync/session", async () => createTvSession());
  fastify.get("/tv-sync/session", async () => createTvSession());

  fastify.post<{ Params: { sessionId: string }; Body: { videoId?: string } }>(
    "/tv-sync/session/:sessionId/command",
    async (request, reply) => {
      cleanupExpiredSessions();
      const { sessionId } = request.params;
      const session = tvSessions.get(sessionId);
      if (!session) return reply.code(404).send({ error: "session_not_found" });

      const videoId = (request.body?.videoId || "").trim();
      if (!videoId) return reply.code(400).send({ error: "video_id_required" });

      const command: TvCommand = { id: randomUUID(), videoId, sentAt: Date.now() };
      session.lastCommand = command;
      session.updatedAt = Date.now();
      return { ok: true, commandId: command.id };
    },
  );

  fastify.get<{ Params: { sessionId: string }; Querystring: { after?: string } }>(
    "/tv-sync/session/:sessionId/command",
    async (request, reply) => {
      cleanupExpiredSessions();
      const { sessionId } = request.params;
      const session = tvSessions.get(sessionId);
      if (!session) return reply.code(404).send({ error: "session_not_found" });

      const after = request.query.after || "";
      const command = session.lastCommand;
      if (!command || command.id === after) return { hasCommand: false };
      return { hasCommand: true, command };
    },
  );

  return fastify;
};
