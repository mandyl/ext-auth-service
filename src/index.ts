import Fastify from 'fastify';
import { authRoutes } from './routes/auth';
import { loadTokens } from './config/tokens';

const PORT = parseInt(process.env.PORT ?? '8090', 10);
const HOST = process.env.HOST ?? '0.0.0.0';

async function bootstrap(): Promise<void> {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
      transport:
        process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
  });

  // Pre-load tokens at startup
  loadTokens();

  // Register routes
  await fastify.register(authRoutes);

  // Health check
  fastify.get('/health', async (_request, reply) => {
    return reply.status(200).send({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });

  // Graceful shutdown
  const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];
  for (const signal of signals) {
    process.on(signal, async () => {
      fastify.log.info(`Received ${signal}, shutting down gracefully...`);
      await fastify.close();
      process.exit(0);
    });
  }

  try {
    await fastify.listen({ port: PORT, host: HOST });
    fastify.log.info(`ext-auth-service listening on ${HOST}:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

bootstrap();
