import { prisma } from '../persistence/prisma.js';

export class OrganizacaoRepository {
  static async findAll() {
    return prisma.organizacao.findMany({
      orderBy: { razaoSocial: 'asc' },
    });
  }

  static async findById(id: string) {
    return prisma.organizacao.findUnique({ where: { id } });
  }

  static async findByCnpj(cnpj: string) {
    return prisma.organizacao.findUnique({ where: { cnpj } });
  }

  static async create(data: {
    razaoSocial: string;
    cnpj: string;
    inscricaoEstadual?: string | null;
    enderecoCompleto: string;
    telefone?: string;
    email: string;
  }) {
    return prisma.organizacao.create({
      data: {
        razaoSocial: data.razaoSocial,
        cnpj: data.cnpj,
        inscricaoEstadual: data.inscricaoEstadual ?? null,
        enderecoCompleto: data.enderecoCompleto,
        telefone: data.telefone ?? '',
        email: data.email,
      },})}}