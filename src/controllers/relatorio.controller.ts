import { FastifyRequest, FastifyReply } from 'fastify';
import { RelatorioService } from '../services/relatorio.service.js';

export class RelatorioController {
  static async dashboardGeral(_request: FastifyRequest, reply: FastifyReply) {
    const dados = await RelatorioService.obterDashboardGeral();
    return reply.send(dados);
  }

  static async relatorioOrganizacao(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    try {
      const dados = await RelatorioService.obterRelatorioOrganizacao(id);
      return reply.send(dados);
    } catch (error: any) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: error.message || 'Organização não encontrada.',
      });
    }
  }
}