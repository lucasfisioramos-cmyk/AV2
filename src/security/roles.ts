    import { FastifyRequest, FastifyReply } from 'fastify';
import { PapelUsuario } from '@prisma/client';

export function authorize(rolesPermitidos: PapelUsuario[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // request.user é populado automaticamente pelo request.jwtVerify()
    const user = request.user as { papel: PapelUsuario };

    if (!user || !rolesPermitidos.includes(user.papel)) {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Acesso negado: seu perfil não possui permissão para este recurso.',
      });
    }
  };
}