import { FastifyInstance } from 'fastify';
import { PapelUsuario } from '@prisma/client';
import { OrganizacaoController } from '../controllers/organizacao.controller.js';
import { authorize } from '../security/roles.js';

export async function organizacaoRoutes(app: FastifyInstance) {
  app.addHook('onRequest', app.authenticate);

  app.get('/', OrganizacaoController.index);
  app.post(
    '/',
    { preHandler: authorize([PapelUsuario.ADMINISTRADOR, PapelUsuario.OPERADOR_CADASTRO]) },
    OrganizacaoController.store
  );
}