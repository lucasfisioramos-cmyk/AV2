import { FastifyRequest, FastifyReply } from 'fastify';
import { UsuarioService } from '../services/usuario.service.js';

export class AuthController {
  static async login(request: FastifyRequest, reply: FastifyReply) {
    const { usuario, senha } = request.body as { usuario?: string; senha?: string };

    const credencial = await UsuarioService.autenticar(usuario, senha);

    // Gerar token JWT Stateless via Fastify
    const token = request.server.jwt.sign(
      {
        sub: credencial.id,
        usuario: credencial.usuario,
        papel: credencial.papel,
      },
      { expiresIn: '8h' }
    );

    return reply.status(200).send({
      token,
      usuario: credencial.usuario,
      papel: credencial.papel,
    });
  }
}