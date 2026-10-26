import { FastifyRequest, FastifyReply } from 'fastify';
import { LoteService } from '../services/lote.service.js';

export class LoteController {
  static async index(_request: FastifyRequest, reply: FastifyReply) {
    const lotes = await LoteService.listarLotes();
    return reply.send(lotes);
  }

  static async show(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const lote = await LoteService.buscarPorId(id);
    return reply.send(lote);
  }

  static async store(request: FastifyRequest, reply: FastifyReply) {
    const { organizacaoId, notaFiscal, transportadora, observacoes } = request.body as any;

    if (!organizacaoId || !notaFiscal || !transportadora) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'BadRequest',
        message: 'Campos obrigatórios: organizacaoId, notaFiscal, transportadora.',
      });
    }

    const lote = await LoteService.criarLote({
      organizacaoId,
      notaFiscal,
      transportadora,
      observacoes,
    });

    return reply.status(201).send(lote);
  }
}