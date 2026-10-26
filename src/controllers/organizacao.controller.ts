import { FastifyRequest, FastifyReply } from 'fastify';
import { OrganizacaoService } from '../services/organizacao.service.js';

export class OrganizacaoController {
  static async index(_request: FastifyRequest, reply: FastifyReply) {
    const organizacoes = await OrganizacaoService.listarTodas();
    return reply.send(organizacoes);
  }

  static async store(request: FastifyRequest, reply: FastifyReply) {
    const { razaoSocial, cnpj, inscricaoEstadual, enderecoCompleto, telefone, email } =
      request.body as any;

    if (!razaoSocial || !cnpj || !enderecoCompleto || !email) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'BadRequest',
        message: 'Campos obrigatórios: razaoSocial, cnpj, enderecoCompleto, email.',
      });
    }

    const organizacao = await OrganizacaoService.criarOrganizacao({
      razaoSocial,
      cnpj,
      inscricaoEstadual,
      enderecoCompleto,
      telefone,
      email,
    });

    return reply.status(201).send(organizacao);
  }
}