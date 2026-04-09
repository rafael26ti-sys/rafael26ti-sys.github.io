# Controle Rural SaaS

Sistema moderno, escalável e production-ready para controle de produção rural.

## Características

- ✅ **Autenticação Segura**: JWT + bcrypt
- ✅ **Multi-Tenant**: Preparado para múltiplos clientes
- ✅ **Escalável**: Arquitetura em camadas
- ✅ **TypeScript**: Type-safe em todo o projeto
- ✅ **Dashboard Inteligente**: Visualizar estatísticas em tempo real
- ✅ **API RESTful**: Endpoints bem estruturados
- ✅ **Banco de Dados Relacional**: PostgreSQL com Prisma ORM
- ✅ **Validação Robusta**: Zod schemas
- ✅ **UI Moderna**: Tailwind CSS + componentes reutilizáveis

## Funcionalidades Principais

1. **Gestão de Plantações**
   - Registrar plantações
   - Acompanhar culturas
   - Datas de colheita

2. **Controle de Gastos**
   - Categorizar despesas
   - Rastrear custos
   - Associar a plantações

3. **Registrar Colheitas**
   - Quantidade produzida
   - Receitas geradas
   - Cálculo de ROI

4. **Gerenciar Animais**
   - Cadastrar rebanho
   - Acompanhar status
   - Controlar quantidade

5. **Manutenção de Equipamentos**
   - Registrar equipamentos
   - Logs de manutenção
   - Status operacional

## Stack Tecnológico

- **Frontend**: Next.js 16, React 19, TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL + Prisma ORM
- **Styling**: Tailwind CSS
- **Autenticação**: JWT + bcryptjs
- **Validação**: Zod
- **HTTP Client**: Axios
- **Notificações**: React Hot Toast

## Getting Started

### Pré-requisitos
- Node.js >=18
- PostgreSQL

### Instalação

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com suas credenciais do banco de dados

# 3. Executar migrations do Prisma
npx prisma migrate dev --name init

# 4. Iniciar servidor de desenvolvimento
npm run dev
```

O servidor estará disponível em `http://localhost:3000`

### Variáveis de Ambiente

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/controle_rural"
JWT_SECRET="sua-chave-secreta-mudada-em-producao"
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

## Fluxo de Uso

1. **Criar Conta** `/register`
2. **Fazer Login** `/login`
3. **Acessar Dashboard** `/dashboard`
4. **Adicionar Plantações** `/dashboard/plantations`
5. **Registrar Gastos** `/dashboard/expenses`
6. **Ver Colheitas** `/dashboard/harvests`

## Estrutura de Pastas

```
├── app/              # Next.js App Router
├── components/       # Componentes React
├── config/          # Configurações
├── lib/             # Utilitários
├── services/        # Lógica de negócio
├── types/           # Tipos TypeScript
├── prisma/          # Schema e migrations
├── public/          # Assets estáticos
└── styles/          # Estilos globais
```

## Arquitetura

```
┌─────────────────┐
│   Cliente Web   │  (React, TypeScript)
└────────┬────────┘
         │ HTTP
┌────────▼────────┐
│  Next.js Routes │  (API Endpoints)
├─────────────────┤
│  Middleware     │  (Auth, Validation)
└────────┬────────┘
         │
┌────────▼────────┐
│  Services Layer │  (Business Logic)
├─────────────────┤
│  Prisma ORM     │
└────────┬────────┘
         │
┌────────▼────────┐
│   PostgreSQL    │  (Database)
└─────────────────┘
```

## API Endpoints

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registrar
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Dados do usuário

### Plantações
- `GET /api/plantations` - Listar
- `POST /api/plantations` - Criar

### Despesas
- `GET /api/expenses` - Listar
- `POST /api/expenses` - Criar

### Colheitas
- `GET /api/harvests` - Listar
- `POST /api/harvests` - Criar

## Documentação

Veja [ARCHITECTURE.md](./ARCHITECTURE.md) para documentação completa da arquitetura, padrões de design e guia de escalabilidade.

## Desenvolvimento

### Comandos Disponíveis

```bash
npm run dev          # Iniciar dev server
npm run build        # Build para produção
npm start            # Iniciar production server
npm run lint         # Verificar código
npm run type-check   # Verificar tipos
npm run format       # Formatar código
npm run db:push      # Push schema para BD
npm run db:generate  # Gerar Prisma client
npm run db:studio    # Abrir Prisma Studio
```

## Segurança

- Senhas hasheadas com bcrypt
- JWT tokens com expiração
- Cookies HTTP-only
- Validação em múltiplas camadas
- Proteção contra SQL Injection
- CORS configurado

## Performance

- Server Components do Next.js
- Otimização de queries
- Caching de sessão
- Lazy loading
- Code splitting automático

## Contribuindo

1. Criar branch para a feature
2. Fazer commits descritivos
3. Enviar Pull Request
4. Aguardar review

## Licença

MIT

## Suporte

Para dúvidas ou problemas, abra uma issue no repositório.

---

**Desenvolvido com ❤️ para agricultores modernos**
