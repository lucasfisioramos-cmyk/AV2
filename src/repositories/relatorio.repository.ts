import { prisma } from '../persistence/prisma.js';

export class RelatorioRepository {
  // Agrupa equipamentos por status de rastreamento
  static async countEquipamentosPorStatus() {
    return prisma.equipamento.groupBy({
      by: ['statusRastreamento'],
      _count: { id: true },
    });
  }

  // Métricas globais de peso e contagem de equipamentos
  static async aggregateMetricasGerais() {
    return prisma.equipamento.aggregate({
      _sum: { pesoQuilogramas: true },
      _count: { id: true },
    });
  }

  // Contagem total de lotes
  static async countTotalLotes() {
    return prisma.lote.count();
  }

  // Agregação de peso e total de itens de uma organização específica
  static async aggregateMetricasPorOrganizacao(organizacaoId: string) {
    return prisma.equipamento.aggregate({
      where: {
        lote: { organizacaoId },
      },
      _sum: { pesoQuilogramas: true },
      _count: { id: true },
    });
  }
}