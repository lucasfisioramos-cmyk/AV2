import { app } from './app.js';
import { env } from './config/env.js';

async function startServer() {
  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    console.log(`🚀 Servidor greencode rodando em http://${env.HOST}:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Configuração de Graceful Shutdown (captura SIGINT e SIGTERM)
const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];

for (const signal of signals) {
  process.on(signal, async () => {
    console.log(`\n⚠️  Sinal ${signal} recebido. Encerrando servidor graciosamente...`);
    try {
      await app.close();
      console.log('✅ Servidor encerrado com sucesso.');
      process.exit(0);
    } catch (err) {
      console.error('❌ Erro ao encerrar servidor:', err);
      process.exit(1);
    }
  });
}

startServer();