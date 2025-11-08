import Fastify from 'fastify';

const fastify = Fastify({
  logger: true,
});

// API entry point
// Will be populated with routes, plugins, and middleware

fastify.get('/health', async () => {
  return { status: 'ok' };
});

const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
