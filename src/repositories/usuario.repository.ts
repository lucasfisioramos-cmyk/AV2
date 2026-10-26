import { PapelUsuario, Usuario } from '@prisma/client';
import { prisma } from '../persistence/prisma.js';

export class UsuarioRepository {
  static async findById(id: string): Promise<Usuario | null> {
    return prisma.usuario.findUnique({ where: { id } });
  }

  static async findByUsuario(usuario: string): Promise<Usuario | null> {
    return prisma.usuario.findUnique({ where: { usuario } });
  }

  static async countAdmins(): Promise<number> {
    return prisma.usuario.count({
      where: { papel: PapelUsuario.ADMINISTRADOR },
    });
  }

  static async create(data: {
    usuario: string;
    hashSenha: string;
    salt: string;
    papel: PapelUsuario;
  }) {
    return prisma.usuario.create({
      data,
      select: { id: true, usuario: true, papel: true, createdAt: true },
    });
  }

  static async update(
    id: string,
    data: {
      usuario?: string;
      hashSenha?: string;
      salt?: string;
      papel?: PapelUsuario;
    }
  ) {
    return prisma.usuario.update({
      where: { id },
      data,
      select: { id: true, usuario: true, papel: true, updatedAt: true },
    });
  }

  static async updateUltimoAcesso(id: string) {
    return prisma.usuario.update({
      where: { id },
      data: { ultimoAcesso: new Date() },
    });
  }

  static async delete(id: string) {
    return prisma.usuario.delete({ where: { id } });
  }
}