import { FastifyInstance } from 'fastify';
import { PapelUsuario } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { prisma } from '../persistence/prisma.js';
import { authorize } from '../security/roles.js';

export async function organizacaoRoutes(app: FastifyInstance) {
  app.addHook('onRequest', app.authenticate);

  // Listar Organizações
  app.get('/', async (_request, reply) => {
    const organizacoes = await prisma.organizacao.findMany({
      include: { contratoVigente: true },
    });
    return reply.send(organizacoes);
  });

  // Criar Organização
  app.post(
  '/',
  { preHandler: authorize([PapelUsuario.ADMINISTRADOR, PapelUsuario.OPERADOR_CADASTRO]) },
  async (request, reply) => {
    const data = request.body as any;

    const organizacao = await prisma.organizacao.create({
      data: {
        razaoSocial: data.razaoSocial,
        cnpj: data.cnpj,
        inscricaoEstadual: data.inscricaoEstadual,
        enderecoCompleto: data.enderecoCompleto,
        telefone: data.telefone,
        email: data.email,
      },
    });

    return reply.status(201).send(organizacao);
  }
);
}