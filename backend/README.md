# StudyTrack — Banco Relacional SQL

O backend desta versão **não usa Prisma**. Ele usa **SQLite com SQL puro** através do módulo `node:sqlite`.

## Estrutura do banco

O arquivo `database/schema.sql` cria as tabelas relacionais:

- `usuario`
- `disciplina`
- `conteudo`
- `registro_estudo`
- `foto_registro`
- `meta`
- `foto_meta`
- `cronograma`
- `simulado`
- `configuracao`

As relações são feitas com **PRIMARY KEY** e **FOREIGN KEY**, com `ON DELETE CASCADE` ou `ON DELETE SET NULL` quando necessário.

## Executar

Requer Node.js 22 ou superior.

```bash
cd backend
npm install
npm run dev
```

O banco é criado automaticamente em `backend/database/studytrack.db` na primeira execução.

Para carregar os dados demonstrativos depois que o servidor já criou as tabelas, você pode executar o conteúdo de `database/seed.sql` em um cliente SQLite.

API: `http://localhost:3333/health`

## Observação acadêmica

O banco foi modelado de forma relacional e normalizada. Fotos de registros e metas ficam em tabelas próprias (`foto_registro` e `foto_meta`) em vez de serem armazenadas como uma lista dentro de uma coluna.

O app mobile também possui um banco SQLite local em `src/database/database.ts`, usando comandos SQL (`CREATE TABLE`, `SELECT`, `INSERT`, `UPDATE` e `DELETE`).
