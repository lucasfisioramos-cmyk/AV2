import { StatusLote } from '@prisma/client';
import { prisma } from '../persistence/prisma.js';

export class LoteRepository {
  static async findAll() {
    return prisma.lote.findMany({
      include: {
        organizacao: { select: { id: true, razaoSocial: true, cnpj: true } },
        _count: { select: { equipamentos: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async findById(id: string) {
    return prisma.lote.findUnique({
      where: { id },
      include: { organizacao: true, equipamentos: true },
    });
  }

  static async findByNotaFiscalEOrganizacao(notaFiscal: string, organizacaoId: string) {
    return prisma.lote.findFirst({
      where: { notaFiscal, organizacaoId },
    });
  }

  static async create(data: {
    organizacaoId: string;
    notaFiscal: string;
    transportadora: string;
    observacoes?: string;
  }) {
    return prisma.lote.create({
      data: {
        ...data,
        statusProcessamento: StatusLote.RECEBIDO,
      },
    });
  }
}