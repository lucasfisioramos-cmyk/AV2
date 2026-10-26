import { FastifyInstance } from 'fastify';
import { PapelUsuario } from '@prisma/client';
import { UsuarioController } from '../controllers/usuario.controller.js';
import { authorize } from '../security/roles.js';

export async function usuarioRoutes(app: FastifyInstance) {
  app.addHook('onRequest', app.authenticate);

  // Rota para qualquer usuário autenticado trocar sua própria senha
  app.patch('/me/senha', UsuarioController.updateMinhaSenha);

  // 🔒 Rotas exclusivas do ADMINISTRADOR
  app.post(
    '/',
    { preHandler: authorize([PapelUsuario.ADMINISTRADOR]) },
    UsuarioController.store
  );

  app.put(
    '/:id',
    { preHandler: authorize([PapelUsuario.ADMINISTRADOR]) },
    UsuarioController.update
  );

  app.delete(
    '/:id',
    { preHandler: authorize([PapelUsuario.ADMINISTRADOR]) },
    UsuarioController.delete
  );
}