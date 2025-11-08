import { buildApp } from './app.js';

/**
 * Main entry point for the Angry Birdman API server
 *
 * This file:
 * - Builds the Fastify application
 * - Starts the HTTP server
 * - Handles graceful shutdown
 */

async function start() {
  let fastify;

  try {
    // Build application
    fastify = await buildApp();

    // Get configuration
    const port = fastify.config.PORT;
    const host = fastify.config.HOST;

    // Start listening
    await fastify.listen({ port, host });

    fastify.log.info(`Server listening on ${host}:${port}`);
    fastify.log.info(`API documentation available at http://${host}:${port}/docs`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }

  // Graceful shutdown handlers
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];

  for (const signal of signals) {
    process.on(signal, () => {
      if (fastify) {
        fastify.log.info(`Received ${signal}, closing server gracefully`);

        void fastify
          .close()
          .then(() => {
            fastify.log.info('Server closed successfully');
            process.exit(0);
          })
          .catch((err) => {
            fastify.log.error({ err }, 'Error during shutdown');
            process.exit(1);
          });
      }
    });
  }
}

// Start the server
void start();
