CREATE TABLE IF NOT EXISTS usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(190) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    foto TEXT,
    nivel_escolar VARCHAR(60),
    idade VARCHAR(20),
    sexo VARCHAR(20),
    criado_em VARCHAR(64) NOT NULL DEFAULT (DATE_FORMAT(NOW(6), '%Y-%m-%dT%H:%i:%s.%f'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS disciplina (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    nome VARCHAR(120) NOT NULL,
    area VARCHAR(60) NOT NULL,
    nota DOUBLE NOT NULL DEFAULT 0,
    criada_em VARCHAR(64) NOT NULL DEFAULT (DATE_FORMAT(NOW(6), '%Y-%m-%dT%H:%i:%s.%f')),
    UNIQUE KEY uq_disciplina_usuario_nome (usuario_id, nome),
    CONSTRAINT fk_disciplina_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS conteudo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    disciplina_id INT NOT NULL,
    nome VARCHAR(190) NOT NULL,
    estudado TINYINT NOT NULL DEFAULT 0 CHECK (estudado IN (0,1)),
    CONSTRAINT fk_conteudo_disciplina FOREIGN KEY (disciplina_id) REFERENCES disciplina(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS registro_estudo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    disciplina_id INT NOT NULL,
    conteudo_id INT,
    data VARCHAR(64) NOT NULL DEFAULT (DATE_FORMAT(NOW(6), '%Y-%m-%dT%H:%i:%s.%f')),
    duracao INT NOT NULL DEFAULT 0,
    observacao TEXT,
    CONSTRAINT fk_registro_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
    CONSTRAINT fk_registro_disciplina FOREIGN KEY (disciplina_id) REFERENCES disciplina(id) ON DELETE CASCADE,
    CONSTRAINT fk_registro_conteudo FOREIGN KEY (conteudo_id) REFERENCES conteudo(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS foto_registro (
    id INT AUTO_INCREMENT PRIMARY KEY,
    registro_id INT NOT NULL,
    caminho TEXT NOT NULL,
    CONSTRAINT fk_foto_registro FOREIGN KEY (registro_id) REFERENCES registro_estudo(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS meta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    texto TEXT NOT NULL,
    feita TINYINT NOT NULL DEFAULT 0 CHECK (feita IN (0,1)),
    observacao TEXT,
    criada_em VARCHAR(64) NOT NULL DEFAULT (DATE_FORMAT(NOW(6), '%Y-%m-%dT%H:%i:%s.%f')),
    CONSTRAINT fk_meta_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS foto_meta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    meta_id INT NOT NULL,
    caminho TEXT NOT NULL,
    CONSTRAINT fk_foto_meta FOREIGN KEY (meta_id) REFERENCES meta(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cronograma (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    disciplina_id INT NOT NULL,
    data VARCHAR(30) NOT NULL,
    inicio VARCHAR(30) NOT NULL,
    fim VARCHAR(30) NOT NULL,
    titulo VARCHAR(190) NOT NULL,
    observacao TEXT,
    concluido TINYINT NOT NULL DEFAULT 0 CHECK (concluido IN (0,1)),
    CONSTRAINT fk_cronograma_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
    CONSTRAINT fk_cronograma_disciplina FOREIGN KEY (disciplina_id) REFERENCES disciplina(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS simulado (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    disciplina_id INT,
    titulo VARCHAR(190) NOT NULL,
    arquivo TEXT NOT NULL,
    data_adicionado VARCHAR(64) NOT NULL DEFAULT (DATE_FORMAT(NOW(6), '%Y-%m-%dT%H:%i:%s.%f')),
    CONSTRAINT fk_simulado_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
    CONSTRAINT fk_simulado_disciplina FOREIGN KEY (disciplina_id) REFERENCES disciplina(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS configuracao (
    usuario_id INT PRIMARY KEY,
    tema VARCHAR(10) NOT NULL DEFAULT 'dark' CHECK (tema IN ('dark','light')),
    CONSTRAINT fk_config_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_disciplina_usuario ON disciplina(usuario_id);
CREATE INDEX idx_conteudo_disciplina ON conteudo(disciplina_id);
CREATE INDEX idx_registro_usuario_data ON registro_estudo(usuario_id, data);
CREATE INDEX idx_registro_disciplina ON registro_estudo(disciplina_id);
CREATE INDEX idx_cronograma_usuario_data ON cronograma(usuario_id, data);
CREATE INDEX idx_meta_usuario ON meta(usuario_id);
CREATE INDEX idx_simulado_usuario ON simulado(usuario_id);
