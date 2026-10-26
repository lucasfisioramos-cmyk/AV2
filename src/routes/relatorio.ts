import { FastifyInstance } from 'fastify';
import { PapelUsuario } from '@prisma/client';
import { prisma } from '../persistence/prisma.js';
import { authorize } from '../security/roles.js';

export async function relatorioRoutes(app: FastifyInstance) {
  app.addHook('onRequest', app.authenticate);

  // Perfis com acesso aos relatórios do sistema
  const perfisAutorizados = [
    PapelUsuario.ADMINISTRADOR,
    PapelUsuario.GESTOR_ALMOXARIFADO,
    PapelUsuario.AUDITOR,
  ];

  // 1. Dashboard de Métricas Gerais
  app.get(
    '/status',
    { preHandler: authorize(perfisAutorizados) },
    async (_request, reply) => {
      // Agrupamento de Equipamentos por Status de Rastreamento
      const equipamentosPorStatus = await prisma.equipamento.groupBy({
        by: ['statusRastreamento'],
        _count: {
          id: true,
        },
      });

      // Soma total de peso processado (em kg)
      const pesoTotal = await prisma.equipamento.aggregate({
        _sum: {
          pesoQuilogramas: true,
        },
        _count: {
          id: true,
        },
      });

      // Total de Lotes cadastrados
      const totalLotes = await prisma.lote.count();

      return reply.send({
        resumoGeral: {
          totalLotes,
          totalEquipamentos: pesoTotal._count.id,
          pesoTotalKg: pesoTotal._sum.pesoQuilogramas || 0,
        },
        equipamentosPorStatus,
      });
    }
  );

  // 2. Relatório Consolidado de uma Organização Específica
  app.get(
    '/organizacao/:id',
    { preHandler: authorize(perfisAutorizados) },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const organizacao = await prisma.organizacao.findUnique({
        where: { id },
        include: {
          lotes: {
            include: {
              _count: {
                select: { equipamentos: true },
              },
            },
          },
        },
      });

      if (!organizacao) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Organização não encontrada.',
        });
      }

      // Buscar soma do peso total dos equipamentos dessa organização
      const agregacaoPeso = await prisma.equipamento.aggregate({
        where: {
          lote: {
            organizacaoId: id,
          },
        },
        _sum: {
          pesoQuilogramas: true,
        },
        _count: {
          id: true,
        },
      });

      return reply.send({
        organizacao: {
          id: organizacao.id,
          razaoSocial: organizacao.razaoSocial,
          cnpj: organizacao.cnpj,
        },
        metricas: {
          totalLotes: organizacao.lotes.length,
          totalEquipamentos: agregacaoPeso._count.id,
          pesoTotalKg: agregacaoPeso._sum.pesoQuilogramas || 0,
        },
        lotes: organizacao.lotes,
      });
    }
  );
}