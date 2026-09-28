PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS usuario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    foto TEXT,
    nivel_escolar TEXT,
    idade TEXT,
    sexo TEXT,
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS disciplina (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    nome TEXT NOT NULL,
    area TEXT NOT NULL,
    nota REAL NOT NULL DEFAULT 0,
    criada_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
    UNIQUE (usuario_id, nome)
);

CREATE TABLE IF NOT EXISTS conteudo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    disciplina_id INTEGER NOT NULL,
    nome TEXT NOT NULL,
    estudado INTEGER NOT NULL DEFAULT 0 CHECK (estudado IN (0,1)),
    FOREIGN KEY (disciplina_id) REFERENCES disciplina(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS registro_estudo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    disciplina_id INTEGER NOT NULL,
    conteudo_id INTEGER,
    data TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    duracao INTEGER NOT NULL DEFAULT 0,
    observacao TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (disciplina_id) REFERENCES disciplina(id) ON DELETE CASCADE,
    FOREIGN KEY (conteudo_id) REFERENCES conteudo(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS foto_registro (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    registro_id INTEGER NOT NULL,
    caminho TEXT NOT NULL,
    FOREIGN KEY (registro_id) REFERENCES registro_estudo(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS meta (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    texto TEXT NOT NULL,
    feita INTEGER NOT NULL DEFAULT 0 CHECK (feita IN (0,1)),
    observacao TEXT,
    criada_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS foto_meta (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meta_id INTEGER NOT NULL,
    caminho TEXT NOT NULL,
    FOREIGN KEY (meta_id) REFERENCES meta(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cronograma (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    disciplina_id INTEGER NOT NULL,
    data TEXT NOT NULL,
    inicio TEXT NOT NULL,
    fim TEXT NOT NULL,
    titulo TEXT NOT NULL,
    observacao TEXT,
    concluido INTEGER NOT NULL DEFAULT 0 CHECK (concluido IN (0,1)),
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (disciplina_id) REFERENCES disciplina(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS simulado (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    disciplina_id INTEGER,
    titulo TEXT NOT NULL,
    arquivo TEXT NOT NULL,
    data_adicionado TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (disciplina_id) REFERENCES disciplina(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS configuracao (
    usuario_id INTEGER PRIMARY KEY,
    tema TEXT NOT NULL DEFAULT 'dark' CHECK (tema IN ('dark','light')),
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_disciplina_usuario ON disciplina(usuario_id);
CREATE INDEX IF NOT EXISTS idx_conteudo_disciplina ON conteudo(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_registro_usuario_data ON registro_estudo(usuario_id, data);
CREATE INDEX IF NOT EXISTS idx_registro_disciplina ON registro_estudo(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_cronograma_usuario_data ON cronograma(usuario_id, data);
CREATE INDEX IF NOT EXISTS idx_meta_usuario ON meta(usuario_id);
CREATE INDEX IF NOT EXISTS idx_simulado_usuario ON simulado(usuario_id);
