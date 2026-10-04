#!/usr/bin/env node
/**
 * Sobe o StudyTrack inteiro (backend + app Expo) com um único comando:
 *
 *   npm start
 *
 * Argumentos extras são repassados para o Expo, por exemplo:
 *   npm start -- --web
 *   npm start -- --android
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isWindows = process.platform === 'win32';

const CYAN = '\u001b[36m';
const GREEN = '\u001b[32m';
const RED = '\u001b[31m';
const RESET = '\u001b[0m';

const PORTA_API = process.env.PORT || '3333';
const PORTA_APP = process.env.EXPO_METRO_PORT || '8081';

/**
 * Executa um comando npm/npx.
 *
 * No Windows, `npm` e `npx` são arquivos `.cmd`. Desde o Node 18.20/20.12/21.7
 * (patch do CVE-2024-27980) o `spawn` lança `EINVAL` ao executá-los com
 * `shell: false`, então eles precisam ser chamados via `cmd.exe /d /s /c`.
 */
function toCommand(command, args) {
  if (!isWindows) return { command, args };
  return { command: process.env.ComSpec || 'cmd.exe', args: ['/d', '/s', '/c', [command, ...args].join(' ')] };
}

const banner = (color, title, detail) => {
  console.log(`${color}[${title}]${RESET} ${detail}`);
};

/** Mata o processo e toda a árvore de filhos (necessário no Windows). */
function killTree(child) {
  if (!child || child.killed) return;
  if (isWindows && child.pid) {
    spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    try {
      child.kill('SIGTERM');
    } catch {
      /* o processo já encerrou */
    }
  }
}

const children = [];
let shuttingDown = false;

function run(name, color, command, args, cwd) {
  const { command: cmd, args: cmdArgs } = toCommand(command, args);
  const child = spawn(cmd, cmdArgs, { cwd, stdio: 'inherit', shell: false });
  children.push(child);

  child.on('error', (error) => {
    console.error(`${color}[${name}]${RESET} falhou ao iniciar: ${error.message}`);
    shutdown(1);
  });

  child.on('exit', (code, signal) => {
    if (shuttingDown) return;
    // Se um dos serviços cair, derruba o outro para não deixar estado inconsistente.
    console.error(`${color}[${name}]${RESET} encerrado (${signal || code}).`);
    const hint = name === 'APP' ? PORTA_APP : name === 'API' ? PORTA_API : null;
    if (code === 1 && hint) {
      console.error(
        `${RED}Porta em uso?${RESET} Outro processo provavelmente já está usando a porta ${hint}. ` +
          `Feche o processo anterior ou rode com outra porta.`
      );
    }
    shutdown(code ?? 0);
  });

  return child;
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) killTree(child);
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

// O backend usa `node:sqlite`, disponível a partir do Node 22.
const [nodeMajor] = process.versions.node.split('.').map(Number);
if (nodeMajor < 22) {
  console.error(`${RED}Node.js 22 ou superior é necessário para rodar o backend.${RESET}`);
  console.error(`Versão atual: ${process.versions.node}`);
  process.exit(1);
}

const expoArgs = ['expo', 'start', ...process.argv.slice(2)];

banner(GREEN, 'API', `http://localhost:${PORTA_API}  (health: /health)`);
run('API', GREEN, 'npm', ['start'], path.join(rootDir, 'backend'));

banner(CYAN, 'APP', 'Expo Metro — abra o QR code no Expo Go');
run('APP', CYAN, 'npx', expoArgs, rootDir);