import { FastifyRequest, FastifyReply } from 'fastify';
import { EstadoFisico, StatusRastreamento, TipoEquipamento } from '@prisma/client';
import { EquipamentoService } from '../services/equipamento.service.js';

export class EquipamentoController {
  // 1. Cadastrar novo equipamento (método 'store')
  static async store(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as {
      loteId: string;
      tipo: TipoEquipamento;
      marca: string;
      modelo: string;
      anoFabricacao: number;
      estadoFisico: EstadoFisico;
      pesoQuilogramas: number;
    };

    if (
      !body.loteId ||
      !body.tipo ||
      !body.marca ||
      !body.modelo ||
      !body.anoFabricacao ||
      !body.estadoFisico ||
      body.pesoQuilogramas === undefined
    ) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'BadRequest',
        message: 'Todos os campos obrigatórios do equipamento devem ser preenchidos.',
      });
    }

    const equipamento = await EquipamentoService.criarEquipamento({
      loteId: body.loteId,
      tipo: body.tipo,
      marca: body.marca,
      modelo: body.modelo,
      anoFabricacao: Number(body.anoFabricacao),
      estadoFisico: body.estadoFisico,
      pesoQuilogramas: Number(body.pesoQuilogramas),
    });

    return reply.status(201).send(equipamento);
  }

  // 2. Movimentar equipamento
  static async movimentar(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = request.body as {
      novoStatus: StatusRastreamento;
      origem: string;
      destino: string;
      responsavel: string;
      observacao?: string;
      version: number;
    };

    if (
      !body.novoStatus ||
      !body.origem ||
      !body.destino ||
      !body.responsavel ||
      body.version === undefined
    ) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'BadRequest',
        message:
          'Os campos "novoStatus", "origem", "destino", "responsavel" e "version" são obrigatórios.',
      });
    }

    const resultado = await EquipamentoService.movimentarEquipamento({
      id,
      novoStatus: body.novoStatus,
      origem: body.origem,
      destino: body.destino,
      responsavel: body.responsavel,
      observacao: body.observacao,
      version: Number(body.version),
    });

    return reply.send({
      mensagem: 'Equipamento movimentado com sucesso!',
      ...resultado,
    });
  }

  // 3. Alterar estado físico com verificação de justificativa (método 'alterarEstadoFisico')
  static async alterarEstadoFisico(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = request.body as {
      novoEstado: EstadoFisico;
      justificativa?: string;
      version: number;
    };

    if (!body.novoEstado || body.version === undefined) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'BadRequest',
        message: 'Os campos "novoEstado" e "version" são obrigatórios.',
      });
    }

    const equipamento = await EquipamentoService.alterarEstadoFisico({
      id,
      novoEstado: body.novoEstado,
      justificativa: body.justificativa,
      version: Number(body.version),
    });

    return reply.send(equipamento);
  }

  // 4. Rastrear equipamento por ID ou código de barras
  static async rastrear(request: FastifyRequest, reply: FastifyReply) {
    const { identificador } = request.params as { identificador: string };
    const equipamento = await EquipamentoService.rastrear(identificador);
    return reply.send(equipamento);
  }
}