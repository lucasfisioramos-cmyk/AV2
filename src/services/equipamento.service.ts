import { StatusRastreamento, EstadoFisico, TipoEquipamento } from '@prisma/client';
import { EquipamentoRepository } from '../repositories/equipamento.repository.js';
import { LoteRepository } from '../repositories/lote.repository.js';
import { AppError } from '../errors/app-error.js';

// Mapeamento de Hierarquia do Estado Físico (Regra de Rebaixamento)
const HIERARQUIA_ESTADO_FISICO: Record<EstadoFisico, number> = {
  NOVO: 6,
  BOM_ESTADO: 5,
  USADO_LEVE: 4,
  USADO_MODERADO: 3,
  DANIFICADO_LEVE: 2,
  DANIFICADO_GRAVE: 1,
  INSERVIVEL: 0,
};

export class EquipamentoService {
  // 1. Cadastrar Equipamento respeitando validações de ano, peso e código de barras sequencial
  static async criarEquipamento(data: {
    loteId: string;
    tipo: TipoEquipamento;
    marca: string;
    modelo: string;
    anoFabricacao: number;
    estadoFisico: EstadoFisico;
    pesoQuilogramas: number;
  }) {
    // Validar Ano de Fabricação
    const anoAtual = new Date().getFullYear();
    if (data.anoFabricacao < 1900 || data.anoFabricacao > anoAtual) {
      throw new AppError(`Ano de fabricação deve estar entre 1900 e ${anoAtual}.`, 400);
    }

    // Validar Peso
    if (data.pesoQuilogramas <= 0) {
      throw new AppError('O peso do equipamento deve ser maior que zero.', 400);
    }

    // Verificar se o lote existe
    const lote = await LoteRepository.findById(data.loteId);
    if (!lote) {
      throw new AppError(`Lote '${data.loteId}' não encontrado.`, 404);
    }

    // Gerar posição e código de barras sequencial
    const totalItensNoLote = await EquipamentoRepository.countByLoteId(data.loteId);
    const posicaoNoLote = totalItensNoLote + 1;
    const prefixoTipo = data.tipo.substring(0, 3).toUpperCase();
    const codigoBarrasInterno = `GC-${data.loteId.slice(0, 4)}-${prefixoTipo}-${posicaoNoLote.toString().padStart(3, '0')}`;

    return EquipamentoRepository.create({
      ...data,
      posicaoNoLote,
      codigoBarrasInterno,
      statusRastreamento: StatusRastreamento.AGUARDANDO_TRIAGEM,
    });
  }

  // 2. Movimentar Equipamento com Trava de Desmonte e Optimistic Locking
  static async movimentarEquipamento(params: {
    id: string;
    novoStatus: StatusRastreamento;
    origem: string;
    destino: string;
    responsavel: string;
    observacao?: string;
    version: number;
  }) {
    const equipamento = await EquipamentoRepository.findById(params.id);

    if (!equipamento) {
      throw new AppError('Equipamento não encontrado.', 404);
    }

    // 🔒 REGRA 1: Trava de Desmonte (Exige passar por EM_TRIAGEM antes)
    const ehStatusDesmonte =
      params.novoStatus === StatusRastreamento.EM_DESMONTE ||
      params.novoStatus === StatusRastreamento.AGUARDANDO_DESMONTE;

    if (ehStatusDesmonte && equipamento.statusRastreamento !== StatusRastreamento.EM_TRIAGEM) {
      throw new AppError(
        'Regra Violada: O equipamento deve passar por triagem completa (EM_TRIAGEM) antes de ser enviado para desmonte.',
        400
      );
    }

    // 🔒 Concorrência: Check de Optimistic Locking
    if (equipamento.version !== params.version) {
      throw new AppError(
        'O registro foi atualizado por outro usuário simultaneamente. Recarregue os dados e tente novamente.',
        409
      );
    }

    try {
      return await EquipamentoRepository.movimentarComTransacao({
        equipamentoId: params.id,
        versionAtual: params.version,
        novoStatus: params.novoStatus,
        origem: params.origem,
        destino: params.destino,
        responsavel: params.responsavel,
        observacao: params.observacao,
      });
    } catch {
      throw new AppError('Falha de concorrência ao movimentar o equipamento. Tente novamente.', 409);
    }
  }

  // 3. Alterar Estado Físico com Regra de Justificativa para Rebaixamento
  static async alterarEstadoFisico(params: {
    id: string;
    novoEstado: EstadoFisico;
    justificativa?: string;
    version: number;
  }) {
    const equipamento = await EquipamentoRepository.findById(params.id);

    if (!equipamento) {
      throw new AppError('Equipamento não encontrado.', 404);
    }

    // 🔒 REGRA 2: Rebaixamento em 2 ou mais categorias exige justificativa
    const nivelAnterior = HIERARQUIA_ESTADO_FISICO[equipamento.estadoFisico];
    const nivelNovo = HIERARQUIA_ESTADO_FISICO[params.novoEstado];

    if (
      nivelAnterior - nivelNovo >= 2 &&
      (!params.justificativa || params.justificativa.trim().length === 0)
    ) {
      throw new AppError(
        'Regra Violada: É obrigatória a justificativa para rebaixamento do estado físico em duas ou mais categorias.',
        400
      );
    }

    if (equipamento.version !== params.version) {
      throw new AppError('Conflito de concorrência ao atualizar estado físico.', 409);
    }

    return EquipamentoRepository.updateEstadoFisico({
      id: params.id,
      novoEstado: params.novoEstado,
      versionAtual: params.version,
    });
  }
  
  // 4. Rastrear equipamento por ID ou código de barras interno
  static async rastrear(identificador: string) {
    if (!identificador) {
      throw new AppError('O identificador (ID ou Código de Barras) é obrigatório.', 400);
    }

    const equipamento = await EquipamentoRepository.findByIdentificador(identificador);

    if (!equipamento) {
      throw new AppError(
        `Equipamento não encontrado para o identificador "${identificador}".`,
        404
      );
    }

    return equipamento;
  }
}