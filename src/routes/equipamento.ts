import { FastifyInstance } from 'fastify';
import {
  PapelUsuario,
  TipoEquipamento,
  EstadoFisico,
  StatusRastreamento,
  StatusLote,
} from '@prisma/client';
import { prisma } from '../persistence/prisma.js';
import { authorize } from '../security/roles.js';

export async function equipamentoRoutes(app: FastifyInstance) {
  app.addHook('onRequest', app.authenticate);

  // 1. Cadastrar Equipamento em um Lote (Triagem)
  app.post(
    '/',
    {
      preHandler: authorize([
        PapelUsuario.ADMINISTRADOR,
        PapelUsuario.OPERADOR_CADASTRO,
        PapelUsuario.GESTOR_ALMOXARIFADO,
      ]),
    },
    async (request, reply) => {
      const {
        loteId,
        codigoBarrasInterno,
        tipo,
        marca,
        modelo,
        anoFabricacao,
        estadoFisico,
        pesoQuilogramas,
        posicaoNoLote,
      } = request.body as {
        loteId: string;
        codigoBarrasInterno: string;
        tipo: TipoEquipamento;
        marca: string;
        modelo: string;
        anoFabricacao: number;
        estadoFisico: EstadoFisico;
        pesoQuilogramas: number;
        posicaoNoLote: number;
      };

      if (
        !loteId ||
        !codigoBarrasInterno ||
        !tipo ||
        !marca ||
        !modelo ||
        !anoFabricacao ||
        !estadoFisico ||
        pesoQuilogramas === undefined ||
        posicaoNoLote === undefined
      ) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'BadRequest',
          message:
            'Todos os campos obrigatórios do equipamento devem ser preenchidos.',
        });
      }

      // Validar existência do lote
      const lote = await prisma.lote.findUnique({ where: { id: loteId } });
      if (!lote) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Lote associado não encontrado.',
        });
      }

      // Criar o equipamento com status padrão ou TRIAGEM
      const equipamento = await prisma.equipamento.create({
        data: {
          loteId,
          codigoBarrasInterno,
          tipo,
          marca,
          modelo,
          anoFabricacao,
          estadoFisico,
          pesoQuilogramas,
          posicaoNoLote,
          statusRastreamento: StatusRastreamento.AGUARDANDO_TRIAGEM,
        },
      });

      // Atualizar status de processamento do Lote para EM_TRIAGEM se estiver como RECEBIDO
      if (lote.statusProcessamento === StatusLote.RECEBIDO) {
        await prisma.lote.update({
          where: { id: loteId },
          data: { statusProcessamento: StatusLote.EM_TRIAGEM },
        });
      }

      return reply.status(201).send(equipamento);
    }
  );

  // 2. Rastreamento / Consulta por Código de Barras Interno ou ID
  app.get('/rastrear/:identificador', async (request, reply) => {
    const { identificador } = request.params as { identificador: string };

    const equipamento = await prisma.equipamento.findFirst({
      where: {
        OR: [{ id: identificador }, { codigoBarrasInterno: identificador }],
      },
      include: {
        lote: {
          include: {
            organizacao: true,
          },
        },
        historicoMovimentacao: true,
      },
    });

    if (!equipamento) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Equipamento não encontrado para o identificador fornecido.',
      });
    }

    return reply.send(equipamento);
  });

  // 3. Registrar Movimentação e Atualizar Status do Equipamento
app.patch(
  '/:id/movimentar',
  {
    preHandler: authorize([
      PapelUsuario.ADMINISTRADOR,
      PapelUsuario.OPERADOR_CADASTRO,
      PapelUsuario.GESTOR_ALMOXARIFADO,
    ]),
  },
  async (request, reply) => {
    const { id } = request.params as { id: string };
    const { novoStatus, origem, destino, responsavel, observacao, version } = request.body as {
      novoStatus: StatusRastreamento;
      origem: string;
      destino: string;
      responsavel: string;
      observacao?: string;
      version: number; // Obrigatório para Optimistic Locking
    };

    if (!novoStatus || !origem || !destino || !responsavel || version === undefined) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'BadRequest',
        message: 'Os campos "novoStatus", "origem", "destino", "responsavel" e "version" são obrigatórios.',
      });
    }

    // Buscar equipamento atual
    const equipamento = await prisma.equipamento.findUnique({ where: { id } });

    if (!equipamento) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Equipamento não encontrado.',
      });
    }

    // Checagem de Optimistic Locking
    if (equipamento.version !== version) {
      return reply.status(409).send({
        statusCode: 409,
        error: 'Conflict',
        message:
          'O registro foi atualizado por outro usuário enquanto você o visualizava. Por favor, recarregue os dados e tente novamente.',
      });
    }

    // Transação Atômica: Atualiza o Equipamento e Grava o Histórico na tabela Movimentacao
    const [equipamentoAtualizado, movimentacao] = await prisma.$transaction([
      prisma.equipamento.update({
        where: { id, version },
        data: {
          statusRastreamento: novoStatus,
          version: { increment: 1 }, // Incrementa a versão atomicamente
        },
      }),
      prisma.movimentacao.create({
        data: {
          equipamentoId: id,
          origem,
          destino,
          responsavel,
          observacao,
        },
      }),
    ]);

    return reply.send({
      mensagem: 'Equipamento movimentado com sucesso!',
      equipamento: equipamentoAtualizado,
      movimentacao,
    });
  }
);}