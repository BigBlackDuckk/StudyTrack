// Learn more https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// O `expo-sqlite` roda no navegador através do wa-sqlite compilado para WebAssembly.
// Sem esta extensão o Metro não resolve o import de `.wasm` e o bundle web quebra
// com "Unable to resolve module ./wa-sqlite/wa-sqlite.wasm".
config.resolver.assetExts.push('wasm');

module.exports = config;