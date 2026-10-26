import { FastifyInstance } from 'fastify';
import { PapelUsuario } from '@prisma/client';
import { LoteController } from '../controllers/lote.controller.js';
import { authorize } from '../security/roles.js';

export async function loteRoutes(app: FastifyInstance) {
  app.addHook('onRequest', app.authenticate);

  app.get('/', LoteController.index);
  
  app.post(
    '/',
    { preHandler: authorize([PapelUsuario.ADMINISTRADOR, PapelUsuario.GESTOR_ALMOXARIFADO]) },
    LoteController.store
  );
}