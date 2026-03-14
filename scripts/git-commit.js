#!/usr/bin/env node

import { execSync } from 'child_process';

try {
  console.log('Configurando Git...');
  execSync('git config user.email "v0@vercel.com"');
  execSync('git config user.name "v0 AI"');

  console.log('Adicionando todas as mudanças...');
  execSync('git add .');

  console.log('Fazendo commit...');
  execSync('git commit -m "fix: corrigir dependências incompatíveis (eslint, jsonwebtoken, lucide-react)"');

  console.log('Fazendo push...');
  execSync('git push origin HEAD');

  console.log('✓ Mudanças enviadas para GitHub com sucesso!');
} catch (error) {
  console.error('Erro ao fazer commit:', error.message);
  process.exit(1);
}
