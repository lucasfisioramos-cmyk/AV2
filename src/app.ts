import Fastify, { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import { loteRoutes } from './routes/lote.js';
import { equipamentoRoutes } from './routes/equipamento.js';
import { relatorioRoutes } from './routes/relatorio.js';
import { healthRoutes } from './routes/health.js';
import { env } from './config/env.js';
import { organizacaoRoutes } from './routes/organizacao.js';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { AppError } from './errors/app-error.js';
import { usuarioRoutes } from './routes/usuario.js';
import { authRoutes } from './routes/auth.js';


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

await app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Greencode API',
      description: 'API Backend para Gestão e Rastreabilidade de Resíduos Eletrônicos (E-Waste)',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
});

// Configurar Interface Gráfica UI
await app.register(fastifySwaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: false,
  },
});

// Registrar Rotas da API
app.register(healthRoutes, { prefix: '/api/v1' });
app.register(authRoutes, { prefix: '/api/v1/auth' });
app.register(organizacaoRoutes, { prefix: '/api/v1/organizacoes' });
app.register(loteRoutes, { prefix: '/api/v1/lotes' });
app.register(equipamentoRoutes, { prefix: '/api/v1/equipamentos' });
app.register(relatorioRoutes, { prefix: '/api/v1/relatorios' });
app.register(usuarioRoutes, { prefix: '/api/v1/usuarios' });

// Handler Global de Erros
app.setErrorHandler((error: any, _request, reply) => {
  // 1. Tratar erros de regra de negócio customizados (AppError)
  if (error instanceof AppError) {
    const errorLabel =
      error.statusCode === 404
        ? 'Not Found'
        : error.statusCode === 409
        ? 'Conflict'
        : 'Bad Request';

    return reply.status(error.statusCode).send({
      statusCode: error.statusCode,
      error: errorLabel,
      message: error.message,
    });
  }

  // 2. Tratar erros nativos de validação do Fastify / Zod (Status 400)
  if (error.statusCode === 400) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: error.message,
    });
  }

  // 3. Fallback para erros não tratados de servidor (Status 500)
  app.log.error(error);

  return reply.status(500).send({
    statusCode: 500,
    error: 'Internal Server Error',
    message: 'Ocorreu um erro interno no servidor.',
  });
});