import { FastifyInstance } from 'fastify';
import { PapelUsuario } from '@prisma/client';
import { EquipamentoController } from '../controllers/equipamento.controller.js';
import { authorize } from '../security/roles.js';

export async function equipamentoRoutes(app: FastifyInstance) {
  app.addHook('onRequest', app.authenticate);

  app.get('/rastrear/:identificador', EquipamentoController.rastrear);

  app.post(
    '/',
    {
      preHandler: authorize([
        PapelUsuario.ADMINISTRADOR,
        PapelUsuario.OPERADOR_CADASTRO,
        PapelUsuario.GESTOR_ALMOXARIFADO,
      ]),
    },
    EquipamentoController.store
  );

  app.patch(
    '/:id/movimentar',
    {
      preHandler: authorize([
        PapelUsuario.ADMINISTRADOR,
        PapelUsuario.OPERADOR_CADASTRO,
        PapelUsuario.GESTOR_ALMOXARIFADO,
      ]),
    },
    EquipamentoController.movimentar
  );

  app.patch(
    '/:id/estado-fisico',
    {
      preHandler: authorize([
        PapelUsuario.ADMINISTRADOR,
        PapelUsuario.OPERADOR_CADASTRO,
        PapelUsuario.GESTOR_ALMOXARIFADO,
      ]),
    },
    EquipamentoController.alterarEstadoFisico
  );
}