import { FastifyRequest, FastifyReply } from 'fastify';
import { PapelUsuario } from '@prisma/client';
import { UsuarioService } from '../services/usuario.service.js';

export class UsuarioController {
  // Criar novo usuário (Apenas ADM)
  static async store(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as {
      usuario: string;
      senhaPlana: string;
      papel: PapelUsuario;
    };

    const novoUsuario = await UsuarioService.criarUsuario(body);
    return reply.status(201).send(novoUsuario);
  }

  // Editar usuário (Apenas ADM)
  static async update(request: FastifyRequest, reply: FastifyReply) {
    const usuarioAutenticado = request.user as { sub: string };
    const { id } = request.params as { id: string };
    const body = request.body as {
      usuario?: string;
      senha?: string;
      papel?: PapelUsuario;
    };

    const usuarioAtualizado = await UsuarioService.editarUsuario({
      idUsuarioAlvo: id,
      idUsuarioExecuto: usuarioAutenticado.sub,
      novoUsuario: body.usuario,
      novaSenha: body.senha,
      novoPapel: body.papel,
    });

    return reply.send({
      mensagem: 'Usuário atualizado com sucesso!',
      usuario: usuarioAtualizado,
    });
  }

  // Alterar a própria senha (Qualquer usuário autenticado)
  static async updateMinhaSenha(request: FastifyRequest, reply: FastifyReply) {
    const usuarioAutenticado = request.user as { sub: string };
    const { novaSenha } = request.body as { novaSenha?: string };

    if (!novaSenha) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'BadRequest',
        message: 'A nova senha é obrigatória.',
      });
    }

    await UsuarioService.editarUsuario({
      idUsuarioAlvo: usuarioAutenticado.sub,
      idUsuarioExecuto: usuarioAutenticado.sub,
      novaSenha,
    });

    return reply.send({ mensagem: 'Sua senha foi alterada com sucesso!' });
  }

  // Deletar usuário (Apenas ADM)
  static async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    await UsuarioService.deletarUsuario(id);
    return reply.send({ mensagem: 'Usuário removido com sucesso!' });
  }
}