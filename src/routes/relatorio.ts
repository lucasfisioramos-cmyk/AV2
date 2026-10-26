import { FastifyInstance } from 'fastify';
import { PapelUsuario } from '@prisma/client';
import { RelatorioController } from '../controllers/relatorio.controller.js';
import { authorize } from '../security/roles.js';

export async function relatorioRoutes(app: FastifyInstance) {
  app.addHook('onRequest', app.authenticate);

  const perfisAutorizados = [
    PapelUsuario.ADMINISTRADOR,
    PapelUsuario.GESTOR_ALMOXARIFADO,
    PapelUsuario.AUDITOR,
  ];

  app.get('/status', { preHandler: authorize(perfisAutorizados) }, RelatorioController.dashboardGeral);
  app.get('/organizacao/:id', { preHandler: authorize(perfisAutorizados) }, RelatorioController.relatorioOrganizacao);
}