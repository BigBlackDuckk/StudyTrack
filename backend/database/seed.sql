INSERT OR IGNORE INTO usuario (id, nome, email, senha, nivel_escolar)
VALUES (1, 'Usuário Demo', 'demo@studytrack.local', '123456', 'Ensino Médio');

INSERT OR IGNORE INTO disciplina (id, usuario_id, nome, area, nota) VALUES
(1, 1, 'Matemática', 'Exatas', 74),
(2, 1, 'Física', 'Exatas', 60),
(3, 1, 'Redação', 'Linguagens', 85),
(4, 1, 'História', 'Humanas', 78);

INSERT OR IGNORE INTO conteudo (id, disciplina_id, nome, estudado) VALUES
(1, 1, 'Funções', 1),
(2, 1, 'Progressão Aritmética', 1),
(3, 1, 'Progressão Geométrica', 0),
(4, 2, 'Cinemática', 1),
(5, 2, 'Dinâmica', 0),
(6, 3, 'Estrutura da redação ENEM', 1),
(7, 3, 'Proposta de intervenção', 0),
(8, 4, 'Revolução Francesa', 1),
(9, 4, 'Era Vargas', 0);

INSERT OR IGNORE INTO configuracao (usuario_id, tema) VALUES (1, 'dark');

INSERT OR IGNORE INTO simulado (id, usuario_id, disciplina_id, titulo, arquivo) VALUES
(1, 1, 1, 'Simulado ENEM — Matemática', 'assets/simulados/simulado-matematica.pdf'),
(2, 1, 2, 'Simulado ENEM — Física', 'assets/simulados/simulado-fisica.pdf'),
(3, 1, 4, 'Simulado — História', 'assets/simulados/simulado-historia.pdf');
