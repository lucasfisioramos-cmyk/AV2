# ♻️ Greencode - Sistema de Logística Reversa (API RESTful)

> **API RESTful robusta desenvolvida para a gestão e rastreabilidade de ativos eletrônicos em processos de logística reversa, triagem e desmonte.**

Este projeto é a evolução da aplicação CLI para uma arquitetura monolítica moderna em camadas, utilizando **Fastify**, **TypeScript** e **Prisma ORM** com **PostgreSQL** / **SQLite**, em conformidade com as diretrizes de avaliação da FATEC.

---

## Arquitetura do Sistema

O projeto segue o padrão **Controller-Service-Repository (CSR)**:

* **Routes (`src/routes`)**: Definição declarativa dos endpoints HTTP com suporte a autenticação stateless JWT e controle de acesso baseado em papéis (**RBAC**).
* **Controllers (`src/controllers`)**: Manipulação de requisições e respostas HTTP.
* **Services (`src/services`)**: Camada de domínio contendo as regras e travas de negócio (validação de CNPJ, concorrência otimista, janela temporal de lotes, transições de estado físico e proteção do único administrador).
* **Repositories (`src/repositories`)**: Abstração da camada de persistência com chamadas otimizadas do **Prisma Client**.

---

## 🛠️ Pré-requisitos

Para executar o projeto localmente, certifique-se de ter instalado:

* **Node.js** (v18.x, v20.x ou superior)
* **npm** (v9.x ou superior)
* **Docker & Docker Compose** *(opcional, para execução isolada em container)*

---

## ⚙️ Variáveis de Ambiente

renomear o arquivo `.env.example` para `.env` na raiz do projeto e insira os seus dados. conforme exemplo:

```env
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
DATABASE_URL=DATABASE_URL="postgresql://seu_usuario:seu_password@localhost:5432/nome_do_banco_de_dados"
JWT_SECRET="greencode_super_secret_jwt_key_2026"
```

---

## 🚀 Guia de Instalação e Execução Local (Windows e Linux Ubuntu)

### 1. Clonar o Repositório e Instalar Dependências

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/AV2.git
cd AV2

# Instale as dependências
npm install
```

### 2. Configurar o Banco de Dados e Carga Inicial (Seed)

Execute o comando unificado de setup, que aplica as migrações e popula o banco com dados de teste:

```bash
npm run setup
```

Ou execute os passos individualmente:

```bash
# Gerar os tipos do Prisma Client
npm run prisma:generate

# Executar as migrações no banco
npm run prisma:migrate

# Executar o seed (povoamento inicial de usuários, organizações, lotes e equipamentos)
npm run prisma:seed
```

### 3. Executar a Aplicação

#### Modo Desenvolvimento (Hot-reload)
```bash
npm run dev
```

#### Modo Produção (Compilado)
```bash
# Compilar TypeScript
npm run build

# Iniciar servidor compilado
npm run start
```

A API estará acessível em `http://localhost:3000`.

## Execução via Docker (Containerização)

Construir a Imagem e Rodar o Container

### Construir a imagem Docker

```
docker build -t greencode-api .
```


### Rodar o container
```
docker run -d -p 3000:3000 --name greencode-app greencode-api
```

## 3. Executar Migrações e Seed dentro do Container

```
docker exec -it greencode-app npx prisma migrate dev
docker exec -it greencode-app npx tsx prisma/seed.ts
```


## Documentação da API (Swagger / OpenAPI)

A documentação interativa da API é gerada automaticamente e pode ser acessada após iniciar o servidor:

URL da Documentação: http://localhost:3000/docs

## Verificação de Qualidade e Tipagem

Para garantir a estrita conformidade do TypeScript sem emissão de erros:

```
npx tsc --noEmit
```

## Compatibilidade

Windows: Windows 10 ou superior (PowerShell / CMD)

Linux: Ubuntu 24.04 LTS ou superior / distribuições derivadas

Containers: Docker / Docker Compose