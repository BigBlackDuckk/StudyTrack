# StudyTrack — implementação da primeira etapa

## O que foi adicionado

- Banco local SQLite (`studytrack.db`).
- Tabelas para disciplinas, conteúdos, registros de estudo, metas e configurações.
- Dados iniciais das 4 disciplinas do protótipo.
- Ao tocar em uma disciplina na tela inicial, ela abre uma tela de detalhes.
- Progresso calculado pelos conteúdos estudados.
- Conteúdos podem ser marcados/desmarcados como estudados.
- Novos conteúdos podem ser adicionados.
- Histórico de estudos já possui tabela e serviço para receber as sessões do cronômetro.

## Instalação

Na pasta do projeto:

```powershell
npm install
npx expo install expo-sqlite expo-document-picker expo-file-system
```

Depois:

```powershell
npx expo start
```

## Próxima etapa

1. Migrar a navegação para Expo Router.
2. Transformar Cronograma em CRUD real.
3. Fazer o timer registrar a disciplina e a sessão no SQLite.
4. Adicionar tela de Simulados e seleção de PDFs.
5. Persistir tema escuro e preferências.
6. Criar backend Node.js + Prisma + PostgreSQL para sincronização.
