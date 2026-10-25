import { PrismaClient, PapelUsuario } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const usuarioAdmin = 'admin';
  const senhaPlana = 'Admin123!';

  // Gerar hash e salt idênticos ao ambiente de execução
  const salt = await bcrypt.genSalt(10);
  const hashSenha = await bcrypt.hash(senhaPlana, salt);

  const admin = await prisma.usuario.upsert({
    where: { usuario: usuarioAdmin },
    update: {
      hashSenha,
      salt,
    },
    create: {
      usuario: usuarioAdmin,
      hashSenha,
      salt,
      papel: PapelUsuario.ADMINISTRADOR,
    },
  });

  console.log('✅ Usuário Admin sincronizado com sucesso no banco!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Erro no seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });