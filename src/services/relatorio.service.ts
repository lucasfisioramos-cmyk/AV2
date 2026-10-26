import { RelatorioRepository } from '../repositories/relatorio.repository.js';
import { OrganizacaoRepository } from '../repositories/organizacao.repository.js';

export class RelatorioService {
  static async obterDashboardGeral() {
    const [equipamentosPorStatus, metricasGerais, totalLotes] = await Promise.all([
      RelatorioRepository.countEquipamentosPorStatus(),
      RelatorioRepository.aggregateMetricasGerais(),
      RelatorioRepository.countTotalLotes(),
    ]);

    return {
      resumoGeral: {
        totalLotes,
        totalEquipamentos: metricasGerais._count.id,
        pesoTotalKg: metricasGerais._sum.pesoQuilogramas || 0,
      },
      equipamentosPorStatus,
    };
  }

  static async obterRelatorioOrganizacao(organizacaoId: string) {
    const organizacao = await OrganizacaoRepository.findById(organizacaoId);
    if (!organizacao) {
      throw new Error('Organização não encontrada.');
    }

    const metricas = await RelatorioRepository.aggregateMetricasPorOrganizacao(organizacaoId);

    return {
      organizacao: {
        id: organizacao.id,
        razaoSocial: organizacao.razaoSocial,
        cnpj: organizacao.cnpj,
      },
      metricas: {
        totalEquipamentos: metricas._count.id,
        pesoTotalKg: metricas._sum.pesoQuilogramas || 0,
      },
    };
  }
}