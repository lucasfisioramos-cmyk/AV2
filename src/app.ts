import Fastify, { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import { healthRoutes } from './routes/health.js';
import { authRoutes } from './routes/auth.js';
import { env } from './config/env.js';

export const app = Fastify({
  logger: true,
});

// Registrar o plugin JWT
app.register(fastifyJwt, {
  secret: env.JWT_SECRET || 'fallback_secret_key',
});

// Decorador para verificar autenticação via JWT
app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Token de autenticação inválido ou ausente.',
    });
  }
});

// Registrar Rotas da API
app.register(healthRoutes, { prefix: '/api/v1' });
app.register(authRoutes, { prefix: '/api/v1/auth' });

// Handler Global de Erros
app.setErrorHandler((error: FastifyError | Error, _request, reply) => {
  app.log.error(error);

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