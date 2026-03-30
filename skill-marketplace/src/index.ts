import Fastify from "fastify";

const app = Fastify({
  logger: true,
});

app.get("/health", async () => {
  return { ok: true };
});

const host = process.env.HOST ?? "0.0.0.0";
const port = Number(process.env.PORT ?? 3001);

try {
  await app.listen({ host, port });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
