import { PapelUsuario } from '@prisma/client';
import { UsuarioRepository } from '../repositories/usuario.repository.js';
import { PasswordHasher } from '../security/hasher.js';
import { AppError } from '../errors/app-error.js';

export class UsuarioService {
  // 1. Autenticar usuário
  static async autenticar(usuarioInput?: string, senhaInput?: string) {
    if (!usuarioInput || !senhaInput) {
      throw new AppError('Usuário e senha são obrigatórios.', 400);
    }

    const credencial = await UsuarioRepository.findByUsuario(usuarioInput);
    if (!credencial) {
      throw new AppError('Credenciais inválidas.', 401);
    }

    const senhaValida = await PasswordHasher.comparePassword(senhaInput, credencial.hashSenha);
    if (!senhaValida) {
      throw new AppError('Credenciais inválidas.', 401);
    }

    await UsuarioRepository.updateUltimoAcesso(credencial.id);

    return credencial;
  }

  // 2. Criar novo usuário
  static async criarUsuario(data: {
    usuario: string;
    senhaPlana: string;
    papel: PapelUsuario;
  }) {
    if (!data.usuario || !data.senhaPlana || !data.papel) {
      throw new AppError('Todos os campos (usuário, senha e papel) são obrigatórios.', 400);
    }

    const usuarioExistente = await UsuarioRepository.findByUsuario(data.usuario);
    if (usuarioExistente) {
      throw new AppError(`O usuário "${data.usuario}" já está cadastrado.`, 409);
    }

    const hashResult = await PasswordHasher.hashPassword(data.senhaPlana);

    const hashSenha = typeof hashResult === 'string' ? hashResult : hashResult.hash;
    const salt = typeof hashResult === 'string' ? '' : hashResult.salt || '';

    return UsuarioRepository.create({
      usuario: data.usuario,
      hashSenha,
      salt,
      papel: data.papel,
    });
  }

  // 3. Editar usuário
  static async editarUsuario(params: {
    idUsuarioAlvo: string;
    idUsuarioExecuto: string;
    novoUsuario?: string;
    novaSenha?: string;
    novoPapel?: PapelUsuario;
  }) {
    const executor = await UsuarioRepository.findById(params.idUsuarioExecuto);
    if (!executor) {
      throw new AppError('Usuário responsável não encontrado.', 404);
    }

    const ehProprioUsuario = params.idUsuarioAlvo === params.idUsuarioExecuto;
    const ehAdmin = executor.papel === PapelUsuario.ADMINISTRADOR;

    if (!ehAdmin && !ehProprioUsuario) {
      throw new AppError('Acesso negado: Apenas administradores podem editar outros usuários.', 403);
    }

    const usuarioAlvo = await UsuarioRepository.findById(params.idUsuarioAlvo);
    if (!usuarioAlvo) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    const dadosAtualizacao: {
      usuario?: string;
      hashSenha?: string;
      salt?: string;
      papel?: PapelUsuario;
    } = {};

    if (params.novoUsuario && params.novoUsuario !== usuarioAlvo.usuario) {
      if (!ehAdmin) {
        throw new AppError('Acesso negado: Apenas administradores podem alterar o nome de usuário.', 403);
      }
      const usuarioExistente = await UsuarioRepository.findByUsuario(params.novoUsuario);
      if (usuarioExistente) {
        throw new AppError(`O nome de usuário "${params.novoUsuario}" já está em uso.`, 409);
      }
      dadosAtualizacao.usuario = params.novoUsuario;
    }

    if (params.novoPapel && params.novoPapel !== usuarioAlvo.papel) {
      if (!ehAdmin) {
        throw new AppError('Acesso negado: Apenas administradores podem alterar o perfil de acesso.', 403);
      }

      if (
        usuarioAlvo.papel === PapelUsuario.ADMINISTRADOR &&
        params.novoPapel !== PapelUsuario.ADMINISTRADOR
      ) {
        const totalAdmins = await UsuarioRepository.countAdmins();
        if (totalAdmins <= 1) {
          throw new AppError(
            `Não é possível alterar o perfil do usuário "${usuarioAlvo.usuario}", pois ele é o único administrador do sistema.`,
            400
          );
        }
      }
      dadosAtualizacao.papel = params.novoPapel;
    }

    if (params.novaSenha && params.novaSenha.trim().length > 0) {
      const hashResult = await PasswordHasher.hashPassword(params.novaSenha);
      dadosAtualizacao.hashSenha = typeof hashResult === 'string' ? hashResult : hashResult.hash;
      if (typeof hashResult !== 'string' && hashResult.salt) {
        dadosAtualizacao.salt = hashResult.salt;
      }
    }

    if (Object.keys(dadosAtualizacao).length === 0) {
      throw new AppError('Nenhum dado válido foi fornecido para atualização.', 400);
    }

    return UsuarioRepository.update(params.idUsuarioAlvo, dadosAtualizacao);
  }

  // 4. Deletar usuário
  static async deletarUsuario(idUsuarioAlvo: string) {
    const usuarioAlvo = await UsuarioRepository.findById(idUsuarioAlvo);

    if (!usuarioAlvo) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    if (usuarioAlvo.papel === PapelUsuario.ADMINISTRADOR) {
      const totalAdmins = await UsuarioRepository.countAdmins();
      if (totalAdmins <= 1) {
        throw new AppError(
          `Não é possível remover o usuário "${usuarioAlvo.usuario}", pois ele é o único administrador do sistema.`,
          400
        );
      }
    }

    return UsuarioRepository.delete(idUsuarioAlvo);
  }
}