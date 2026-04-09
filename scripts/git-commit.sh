#!/bin/bash

# Script para fazer commit das mudanças do projeto SaaS
git config user.email "v0@vercel.com"
git config user.name "v0 AI"

# Adicionar todas as mudanças
git add .

# Fazer commit
git commit -m "fix: corrigir dependências incompatíveis (eslint, jsonwebtoken, lucide-react)"

# Fazer push para a branch atual
git push origin HEAD
