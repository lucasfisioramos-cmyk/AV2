import { OrganizacaoRepository } from '../repositories/organizacao.repository.js';
import { AppError } from '../errors/app-error.js';

function validarCNPJ(cnpj: string): boolean {
  const cnpjLimpo = cnpj.replace(/\D/g, '');

  if (cnpjLimpo.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpjLimpo)) return false; // Impede 00000000000000, 11111111111111, etc.

  let tamanho = cnpjLimpo.length - 2;
  let numeros = cnpjLimpo.substring(0, tamanho);
  const digitos = cnpjLimpo.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += Number(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== Number(digitos.charAt(0))) return false;

  tamanho = tamanho + 1;
  numeros = cnpjLimpo.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += Number(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  return resultado === Number(digitos.charAt(1));
}

export class OrganizacaoService {
  static async listarTodas() {
    return OrganizacaoRepository.findAll();
  }

  static async criarOrganizacao(data: {
    razaoSocial: string;
    cnpj: string;
    inscricaoEstadual?: string;
    enderecoCompleto: string;
    telefone?: string;
    email: string;
  }) {
    // 🔒 REGRA LEGADA: Validação Algorítmica do CNPJ
    if (!validarCNPJ(data.cnpj)) {
      throw new AppError(`O CNPJ informado ("${data.cnpj}") é inválido. Checksum incorreto.`, 400);
    }

    const cnpjExistente = await OrganizacaoRepository.findByCnpj(data.cnpj);
    if (cnpjExistente) {
      throw new AppError(`Já existe uma organização cadastrada com o CNPJ ${data.cnpj}.`, 409);
    }

    return OrganizacaoRepository.create(data);
  }
}