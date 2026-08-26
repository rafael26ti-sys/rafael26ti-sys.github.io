# Controle Rural Simples

Repositório oficial do **Controle Rural Simples**, um sistema web pensado para pequenos e médios produtores rurais organizarem produção, estoque, atividades e finanças.

## Estado do projeto

- Passo atual: **1 — Arquitetura**
- Situação: **concluído**
- Próximo passo do PRD: **2 — Banco de dados**
- Site: <https://rafael26ti-sys.github.io/>

Neste passo foram definidas a arquitetura técnica, a estrutura de pastas, as responsabilidades das camadas, os padrões de componentes e a camada de serviços. Nenhuma funcionalidade do MVP, autenticação ou banco de dados foi implementada ainda.

## Arquitetura escolhida

- Front-end: Next.js com App Router, React, TypeScript e Tailwind CSS
- Back-end do MVP: Route Handlers do Next.js e camada de serviços
- Banco planejado: PostgreSQL pelo Supabase
- Autenticação planejada: Supabase Auth com Row Level Security
- Validação: Zod nas entradas e nos limites entre camadas
- Deploy futuro da aplicação: Vercel + Supabase

O GitHub Pages deste repositório apresenta o andamento do projeto. A aplicação completa precisará de hospedagem compatível com o back-end do Next.js.

## Documentação

- [Arquitetura técnica](docs/arquitetura.md)

## Conteúdo atual

```text
.
├── docs/
│   └── arquitetura.md
├── index.html
├── README.md
└── styles.css
```

Este repositório foi reiniciado para seguir a ordem dos “Próximos passos para desenvolvimento” definida no PRD.
