import { LoteRepository } from '../repositories/lote.repository.js';
import { OrganizacaoRepository } from '../repositories/organizacao.repository.js';
import { AppError } from '../errors/app-error.js';

export class LoteService {
  static async criarLote(data: {
    organizacaoId: string;
    notaFiscal: string;
    transportadora: string;
    dataEntrada?: Date | string;
    observacoes?: string;
  }) {
    const organizacao = await OrganizacaoRepository.findById(data.organizacaoId);
    if (!organizacao) throw new AppError('Organização de origem não encontrada.', 404);

    // 🔒 REGRA LEGADA (AV1): Validação da janela de 90 dias e bloqueio de data futura
    const dataEntrada = data.dataEntrada ? new Date(data.dataEntrada) : new Date();
    const agora = new Date();
    
    // Limite inferior: 90 dias atrás
    const limiteNoventaDias = new Date();
    limiteNoventaDias.setDate(agora.getDate() - 90);

    if (dataEntrada > agora) {
      throw new AppError('Regra Violada: A data de entrada do lote não pode ser uma data futura.', 400);
    }

    if (dataEntrada < limiteNoventaDias) {
      throw new AppError('Regra Violada: A data de entrada do lote não pode ser anterior a 90 dias.', 400);
    }

    const loteExistente = await LoteRepository.findByNotaFiscalEOrganizacao(
      data.notaFiscal,
      data.organizacaoId
    );
    if (loteExistente) {
      throw new AppError(
        `Já existe um lote cadastrado com a Nota Fiscal "${data.notaFiscal}" para esta organização.`,
        409
      );
    }

    return LoteRepository.create(data);
  }

  static async listarLotes() {
    return LoteRepository.findAll();
  }

  static async buscarPorId(id: string) {
    const lote = await LoteRepository.findById(id);
    if (!lote) throw new AppError('Lote não encontrado.', 404);
    return lote;
  }
}