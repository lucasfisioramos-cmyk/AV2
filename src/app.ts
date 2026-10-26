import Fastify, { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import { loteRoutes } from './routes/lote.js';
import { equipamentoRoutes } from './routes/equipamento.js';
import { relatorioRoutes } from './routes/relatorio.js';
import { healthRoutes } from './routes/health.js';
import { authRoutes } from './routes/auth.js';
import { env } from './config/env.js';
import { organizacaoRoutes } from './routes/organizacao.js';

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
app.register(organizacaoRoutes, { prefix: '/api/v1/organizacoes' });
app.register(loteRoutes, { prefix: '/api/v1/lotes' });
app.register(equipamentoRoutes, { prefix: '/api/v1/equipamentos' });
app.register(relatorioRoutes, { prefix: '/api/v1/relatorios' });
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