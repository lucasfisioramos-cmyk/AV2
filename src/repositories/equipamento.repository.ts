import { Equipamento, StatusRastreamento, EstadoFisico, StatusLote, TipoEquipamento } from '@prisma/client';
import { prisma } from '../persistence/prisma.js';

export class EquipamentoRepository {
  // 1. Buscar Equipamento por ID
  static async findById(id: string): Promise<Equipamento | null> {
    return prisma.equipamento.findUnique({ where: { id } });
  }

  // 2. Contar quantidade de equipamentos vinculados a um Lote (para gerar a sequência do código de barras)
  static async countByLoteId(loteId: string): Promise<number> {
    return prisma.equipamento.count({ where: { loteId } });
  }

  // 3. Buscar Equipamento por ID ou Código de Barras Interno com relacionamentos
  static async findByIdentificador(identificador: string) {
    return prisma.equipamento.findFirst({
      where: {
        OR: [{ id: identificador }, { codigoBarrasInterno: identificador }],
      },
      include: {
        lote: { include: { organizacao: true } },
        historicoMovimentacao: true,
      },
    });
  }

  // 4. Criar Equipamento e atualizar status do Lote atomicamente via Transação
  static async create(data: {
    loteId: string;
    codigoBarrasInterno: string;
    tipo: TipoEquipamento;
    marca: string;
    modelo: string;
    anoFabricacao: number;
    estadoFisico: EstadoFisico;
    pesoQuilogramas: number;
    posicaoNoLote: number;
    statusRastreamento: StatusRastreamento;
  }) {
    return prisma.$transaction(async (tx) => {
      const equipamento = await tx.equipamento.create({ data });

      // Atualiza o status do Lote de RECEBIDO para EM_TRIAGEM se for o primeiro item
      const lote = await tx.lote.findUnique({ where: { id: data.loteId } });
      if (lote && lote.statusProcessamento === StatusLote.RECEBIDO) {
        await tx.lote.update({
          where: { id: data.loteId },
          data: { statusProcessamento: StatusLote.EM_TRIAGEM },
        });
      }

      return equipamento;
    });
  }

  // 5. Movimentar Equipamento com Optimistic Locking e Transação no Histórico
  static async movimentarComTransacao(params: {
    equipamentoId: string;
    versionAtual: number;
    novoStatus: StatusRastreamento;
    origem: string;
    destino: string;
    responsavel: string;
    observacao?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const equipamentoAtualizado = await tx.equipamento.update({
        where: {
          id: params.equipamentoId,
          version: params.versionAtual,
        },
        data: {
          statusRastreamento: params.novoStatus,
          version: { increment: 1 },
        },
      });

      const movimentacao = await tx.movimentacao.create({
        data: {
          equipamentoId: params.equipamentoId,
          origem: params.origem,
          destino: params.destino,
          responsavel: params.responsavel,
          observacao: params.observacao,
        },
      });

      return { equipamentoAtualizado, movimentacao };
    });
  }

  // 6. Atualizar Estado Físico com verificação atômica de versão (Optimistic Locking)
  static async updateEstadoFisico(params: {
    id: string;
    novoEstado: EstadoFisico;
    versionAtual: number;
  }) {
    return prisma.equipamento.update({
      where: {
        id: params.id,
        version: params.versionAtual,
      },
      data: {
        estadoFisico: params.novoEstado,
        version: { increment: 1 },
      },
    });
  }
}