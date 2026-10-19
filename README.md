"# StudyTrack 📚

Aplicativo de estudos feito com **React Native + Expo**, com API em **Node.js (Express)** e
banco de dados em **MySQL** (com fallback automático para SQLite).

## Funcionalidades

- 📅 **Cronograma** semanal de estudos por disciplina
- ⏱️ **Registro de estudos** com cronômetro e observações
- 🎯 **Metas** pessoais com acompanhamento
- 📝 **Simulados** organizados por disciplina (PDFs de exemplo inclusos)
- 🔔 **Notificações** locais (lembretes, resumo diário, alerta de simulados)
- 🌗 Tema **claro/escuro**, tutorial para novos usuários e backup dos dados
- 📴 Funciona **offline** (SQLite local) e sincroniza com a API quando há conexão

## Como rodar

```bash
npm install
cd backend && npm install && cd ..
npm start          # sobe API (porta 3333) + app Expo juntos
```

- App: escaneie o QR code com o **Expo Go** (ou use `npm run web`)
- API: http://localhost:3333 (teste em `/health`)

## Banco de dados — MySQL (Workbench)

O backend usa **MySQL automaticamente** quando existe um `backend/.env` configurado
(veja `backend/.env.example`). Sem `.env`, ele usa SQLite local sem precisar de nada.

Para conectar no **MySQL Workbench**:

1. Rode o MySQL Server (porta 3306)
2. Crie o banco: `CREATE DATABASE studytrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
3. Copie `backend/.env.example` para `backend/.env` e preencha `MYSQL_USER` / `MYSQL_PASSWORD`
4. Ao iniciar, o servidor cria as tabelas sozinho (`backend/database/schema.mysql.sql`)
5. (Opcional) Dados de demonstração: `mysql studytrack < backend/database/seed.mysql.sql`
6. Start-Process "C:\Program Files\MySQL\MySQL Workbench 8.0 CE\MySQLWorkbench.exe" esse comando 

Usuário demo após o seed: `demo@studytrack.local` / `123456`

## Site informativo

Abra `site/index.html` no navegador — é um site estático (HTML + CSS + JS puros)
que apresenta o projeto, os recursos, a arquitetura e o banco de dados.

## Estrutura

```
App.tsx            raiz do app (sessão, navegação, tema)
src/pages/         telas (Início, Cronograma, Registro, Metas, Simulados, Perfil, Login)
src/componets/     componentes reutilizáveis
src/database/      banco local (expo-sqlite)
src/services/      API, sincronização, notificações, backup
backend/           API Express (server.ts) + schemas SQL + seed
site/              site informativo do projeto
```
" 
