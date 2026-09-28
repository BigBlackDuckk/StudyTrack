# StudyTrack — versão funcional integrada

Esta versão foi ampliada para transformar a interface em um app realmente interligado.

## O que foi adicionado
- Ver todas as matérias em uma tela própria.
- Criar, editar e excluir matérias.
- Abrir uma matéria e visualizar conteúdos, progresso e registros diários.
- Criar, editar, excluir e marcar conteúdos como estudados.
- Registrar estudo manualmente ou pelo timer.
- Observações e fotos nos registros de estudo.
- Porcentagem geral de estudo clicável, com resumo por matéria.
- Gráfico semanal clicável para abrir o painel de progresso.
- Clique em uma matéria no progresso para abrir os registros daquela matéria.
- Metas com observações e foto de evidência, além de concluir/excluir.
- Cronograma em calendário mensal real, com navegação ilimitada para meses/anos anteriores e posteriores.
- Criar, editar, concluir e excluir eventos do cronograma.
- Observações nos eventos do cronograma.
- Simulados em PDF com matéria e visualização integrada (WebView em plataformas nativas; navegador no web).
- Perfil editável, foto, nome, e-mail, nível escolar e modo escuro persistente.
- Dados persistidos em SQLite.

## Como executar

Na pasta do projeto:

```bash
npm install
npx expo install react-native-webview
npx expo start
```

Para Android:

```bash
npx expo start --android
```

Para web:

```bash
npx expo start --web
```

### Observação sobre PDFs
A visualização local por WebView depende do suporte da plataforma a PDF. Em alguns aparelhos Android/Expo Go, o WebView pode não renderizar PDF local diretamente; nesse caso, abra o PDF pelo navegador/visualizador do aparelho ou use um development build com uma biblioteca de PDF nativa.

## Banco
O banco `studytrack.db` é criado automaticamente. A inicialização contém migrações simples para bancos criados por versões anteriores.

## Backend
A pasta `backend/` continua disponível como base de API Node/Express + Prisma. A interface móvel desta versão usa SQLite local para manter tudo funcionando mesmo sem servidor.

## Banco de dados — versão SQL relacional

A versão atual do projeto usa **SQLite + SQL puro** no backend, sem Prisma. O modelo está em `backend/database/schema.sql` e contém `PRIMARY KEY`, `FOREIGN KEY`, índices e relacionamentos entre usuário, disciplinas, conteúdos, registros, metas, cronograma e simulados.

Também foi incluída a documentação acadêmica em `docs/BANCO_RELACIONAL_SQL.md`, com os relacionamentos e exemplos de consultas SQL.


## Versão visual integrada
- Perfil com nome clicável, idade, sexo e escolaridade.
- Gradiente violeta pastel → violeta profundo.
- Simulados demonstrativos já cadastrados no SQLite e arquivos PDF incluídos em `assets/simulados`.
- Cronograma acessível diretamente pela aba `Cronograma`, com calendário mensal navegável.
- Registros de cada matéria exibem observações e miniaturas das fotos anexadas.

## Cadastro e login reais

- A tela de entrada não possui mais nome/e-mail/senha fictícios.
- O cadastro exige nome, e-mail válido, senha com no mínimo 6 caracteres e escolaridade; idade e sexo são opcionais.
- A conta é persistida no SQLite local (`usuario`) e a sessão fica registrada em `configuracao`.
- O e-mail é único e o login valida a senha cadastrada.
- Alterações de nome, escolaridade, idade, sexo e foto do perfil são persistidas no banco.
- A API SQL também recebeu os campos de idade/sexo e passou a usar `scrypt` para novas senhas.

> Para produção pública, a autenticação deve ser centralizada em servidor com HTTPS, sessões/tokens e política de recuperação de senha.
