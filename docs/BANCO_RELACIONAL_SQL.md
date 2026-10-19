# Banco de Dados Relacional — StudyTrack

## SGBD
SQLite

## Principais relacionamentos

```text
USUARIO 1 ─── N DISCIPLINA
DISCIPLINA 1 ─── N CONTEUDO
USUARIO 1 ─── N REGISTRO_ESTUDO
DISCIPLINA 1 ─── N REGISTRO_ESTUDO
CONTEUDO 1 ─── N REGISTRO_ESTUDO
REGISTRO_ESTUDO 1 ─── N FOTO_REGISTRO
USUARIO 1 ─── N META
META 1 ─── N FOTO_META
USUARIO 1 ─── N CRONOGRAMA
DISCIPLINA 1 ─── N CRONOGRAMA
USUARIO 1 ─── N SIMULADO
DISCIPLINA 1 ─── N SIMULADO
USUARIO 1 ─── 1 CONFIGURACAO
```

## Chaves

Cada tabela possui uma chave primária (`PRIMARY KEY`). As tabelas dependentes usam chaves estrangeiras (`FOREIGN KEY`) para manter a integridade referencial.

## Normalização

O modelo evita repetir informações de disciplina, usuário e arquivos. Por exemplo, um registro de estudo aponta para uma disciplina por `disciplina_id`, em vez de guardar o nome da disciplina repetido em cada registro.

As fotos foram separadas em tabelas próprias para manter uma estrutura relacional e permitir várias fotos para um único registro ou meta.

## Consultas úteis para apresentação

```sql
-- Todas as matérias de um usuário
SELECT *
FROM disciplina
WHERE usuario_id = 1
ORDER BY nome;

-- Conteúdos de uma matéria
SELECT d.nome AS disciplina, c.nome AS conteudo, c.estudado
FROM disciplina d
JOIN conteudo c ON c.disciplina_id = d.id
WHERE d.id = 1;

-- Registros diários com a matéria
SELECT r.data, d.nome AS disciplina, r.duracao, r.observacao
FROM registro_estudo r
JOIN disciplina d ON d.id = r.disciplina_id
WHERE r.usuario_id = 1
ORDER BY r.data DESC;

-- Cronograma com matéria
SELECT c.data, c.inicio, c.fim, c.titulo, d.nome AS disciplina
FROM cronograma c
JOIN disciplina d ON d.id = c.disciplina_id
WHERE c.usuario_id = 1
ORDER BY c.data, c.inicio;
```
