import Fastify, { FastifyError } from 'fastify';
import { healthRoutes } from './routes/health.js';

export const app = Fastify({
  logger: true,
});

// Registrar rotas core
app.register(healthRoutes, { prefix: '/api/v1' });

// Handler Global de Erros HTTP
app.setErrorHandler((error: FastifyError | Error, _request, reply) => {
  app.log.error(error);

  // Garantindo o acesso seguro às propriedades do erro
  const statusCode = 'statusCode' in error && typeof error.statusCode === 'number' 
    ? error.statusCode 
    : 500;

  const errorName = error.name || 'InternalServerError';
  const message = error.message || 'Ocorreu um erro interno no servidor.';

  return reply.status(statusCode).send({
    statusCode,
    error: errorName,
    message,
  });
});