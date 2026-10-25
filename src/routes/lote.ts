import { FastifyInstance } from 'fastify';
import { PapelUsuario, StatusLote } from '@prisma/client';
import { prisma } from '../persistence/prisma.js';
import { authorize } from '../security/roles.js';

export async function loteRoutes(app: FastifyInstance) {
  app.addHook('onRequest', app.authenticate);

  // 1. Listar Lotes
  app.get('/', async (_request, reply) => {
    const lotes = await prisma.lote.findMany({
      include: {
        organizacao: {
          select: {
            id: true,
            razaoSocial: true,
            cnpj: true,
          },
        },
        _count: {
          select: { equipamentos: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send(lotes);
  });

  // 2. Buscar Lote por ID
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const lote = await prisma.lote.findUnique({
      where: { id },
      include: {
        organizacao: true,
        equipamentos: true,
      },
    });

    if (!lote) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Lote não encontrado.',
      });
    }

    return reply.send(lote);
  });

  // 3. Criar Novo Lote (ADMINISTRADOR ou GESTOR_ALMOXARIFADO)
  app.post(
  '/',
  { preHandler: authorize([PapelUsuario.ADMINISTRADOR, PapelUsuario.GESTOR_ALMOXARIFADO]) },
  async (request, reply) => {
    const { organizacaoId, notaFiscal, transportadora, observacoes } = request.body as {
      organizacaoId: string;
      notaFiscal: string;
      transportadora: string;
      observacoes?: string;
    };

    if (!organizacaoId || !notaFiscal || !transportadora) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'BadRequest',
        message: 'Os campos "organizacaoId", "notaFiscal" e "transportadora" são obrigatórios.',
      });
    }

    // 1. Validar se a Organização existe
    const organizacao = await prisma.organizacao.findUnique({
      where: { id: organizacaoId },
    });

    if (!organizacao) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Organização de origem não encontrada.',
      });
    }

    // 2. Verificar se já existe um Lote com esta mesma Nota Fiscal
    const loteExistente = await prisma.lote.findFirst({
      where: {
        notaFiscal,
        organizacaoId, // Remova esta linha se optou pela Opção A (global)
      },
    });

    if (loteExistente) {
      return reply.status(409).send({
        statusCode: 409,
        error: 'Conflict',
        message: `Já existe um lote cadastrado com a Nota Fiscal "${notaFiscal}" para esta organização.`,
      });
    }

    // 3. Criar o Lote
    const lote = await prisma.lote.create({
      data: {
        organizacaoId,
        notaFiscal,
        transportadora,
        observacoes,
        statusProcessamento: StatusLote.RECEBIDO,
      },
    });

    return reply.status(201).send(lote);
  }
);
}