import { FastifyInstance } from 'fastify';
import { prisma } from '../persistence/prisma.js';
import { PasswordHasher } from '../security/hasher.js';

export async function authRoutes(app: FastifyInstance) {
  app.post('/login', async (request, reply) => {
    const { usuario, senha } = request.body as { usuario?: string; senha?: string };

    if (!usuario || !senha) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'BadRequest',
        message: 'Usuário e senha são obrigatórios.',
      });
    }

    // Buscar credencial no PostgreSQL via Prisma
    const credencial = await prisma.usuario.findUnique({
      where: { usuario },
    });

    if (!credencial) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Credenciais inválidas.',
      });
    }

    // Validar senha com o hash
    const senhaValida = await PasswordHasher.comparePassword(senha, credencial.hashSenha);

    if (!senhaValida) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Credenciais inválidas.',
      });
    }

    // Atualizar último acesso
    await prisma.usuario.update({
      where: { id: credencial.id },
      data: { ultimoAcesso: new Date() },
    });

    // Gerar token JWT Stateless
    const token = app.jwt.sign(
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
  });
}