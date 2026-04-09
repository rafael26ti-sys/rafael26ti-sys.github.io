# Arquitetura SaaS Escalável - Controle Rural

## Visão Geral

Este projeto foi reorganizado para ser uma base sólida de SaaS escalável, seguindo boas práticas modernas de desenvolvimento. A arquitetura suporta crescimento, múltiplos usuários, e extensibilidade futura.

## Estrutura de Pastas

```
.
├── app/                          # Next.js App Router
│   ├── api/                     # API Routes
│   │   ├── auth/               # Endpoints de autenticação
│   │   ├── plantations/        # Endpoints de plantações
│   │   └── expenses/           # Endpoints de despesas
│   ├── login/                  # Página de login
│   ├── register/               # Página de registro
│   ├── dashboard/              # Dashboard protegido
│   ├── layout.tsx              # Layout raiz
│   └── page.tsx                # Homepage
│
├── components/                   # Componentes React reutilizáveis
│   ├── ui/                     # Componentes básicos (Card, Button, Input)
│   └── layouts/                # Layouts (ProtectedLayout)
│
├── config/                       # Configurações da aplicação
│   └── app.config.ts           # Configuração centralizada
│
├── lib/                          # Utilitários e helpers
│   ├── auth.ts                 # Lógica de JWT e sessão
│   ├── db.ts                   # Cliente Prisma
│   ├── api-middleware.ts       # Middleware de API
│   ├── utils.ts                # Funções utilitárias
│   └── validations.ts          # Schemas Zod
│
├── modules/                      # Módulos de negócio (preparado para expansão)
│   ├── plantations/
│   ├── expenses/
│   └── harvests/
│
├── services/                     # Serviços de negócio
│   └── business.service.ts     # Serviços centralizados
│
├── types/                        # Tipos TypeScript
│   └── index.ts                # Tipos DTOs e interfaces
│
├── styles/                       # Estilos
│   └── globals.css             # Estilos globais com design tokens
│
├── prisma/                       # Banco de dados
│   ├── schema.prisma           # Modelo de dados
│   └── migrations/             # Migrations de banco de dados
│
├── public/                       # Arquivos estáticos
│
└── .env.example                  # Variáveis de ambiente exemplo
```

## Camadas da Aplicação

### 1. **Camada de Apresentação (UI)**
- **Localização**: `/app` e `/components`
- **Responsabilidade**: Renderizar interface do usuário
- **Tecnologias**: React, Next.js, Tailwind CSS
- **Características**:
  - Componentes reutilizáveis em `/components/ui`
  - Layouts protegidos em `/components/layouts`
  - Páginas otimizadas com Server Components quando possível

### 2. **Camada de API (Routes)**
- **Localização**: `/app/api`
- **Responsabilidade**: Endpoints HTTP para comunicação cliente-servidor
- **Padrão**: RESTful
- **Middlewares**: Autenticação, validação, tratamento de erros
- **Estrutura**:
  ```
  POST   /api/auth/login       - Login de usuário
  POST   /api/auth/register    - Cadastro de usuário
  POST   /api/auth/logout      - Logout
  GET    /api/auth/me          - Dados do usuário atual
  GET    /api/plantations      - Listar plantações
  POST   /api/plantations      - Criar plantação
  GET    /api/expenses         - Listar despesas
  POST   /api/expenses         - Criar despesa
  ```

### 3. **Camada de Negócio (Services)**
- **Localização**: `/services`
- **Responsabilidade**: Lógica de negócio centralizada
- **Padrão**: Service Layer Pattern
- **Classes**:
  - `AuthService`: Gerenciar usuários
  - `OrganizationService`: Gerenciar organizações multi-tenant
  - `PlantationService`: Operações com plantações
  - `ExpenseService`: Operações com despesas
  - `HarvestService`: Operações com colheitas
  - `ActivityLogService`: Auditoria e logs

### 4. **Camada de Dados (Database)**
- **Localização**: `/prisma`
- **ORM**: Prisma
- **Banco de Dados**: PostgreSQL (recomendado)
- **Características**:
  - Modelos bem estruturados
  - Relacionamentos definidos
  - Suporte a enumerações
  - Soft deletes via status

### 5. **Camada de Utilidades**
- **Autenticação** (`/lib/auth.ts`): JWT, sessões, cookies
- **Validação** (`/lib/validations.ts`): Schemas Zod
- **Utilitários** (`/lib/utils.ts`): Funções auxiliares
- **Tipos** (`/types/index.ts`): TypeScript interfaces

## Padrões Arquiteturais

### Multi-Tenant (Preparado)
```
Organization
├── User[] (Members)
├── Plantation[]
├── Expense[]
└── Harvest[]
```

A arquitetura suporta múltiplos clientes (organizações) com dados isolados:
- Cada usuário pode ser dono de uma organização
- Usuários podem ser membros de múltiplas organizações
- Dados são filtrados por `organizationId` em todas as queries

### Autenticação e Autorização
```
Fluxo de Login:
1. Usuário submete credenciais
2. API valida email/senha
3. JWT token é gerado
4. Token armazenado em cookie HTTP-only
5. Cliente usa token em requisições futuras
6. Middleware valida token a cada requisição
```

### Validação em Camadas
```
Cliente (Form) → API (Zod Schema) → Service → Database
```

## Modelo de Dados

### Usuários (Users)
- Email, nome, senha (hash)
- Papel (ADMIN, OWNER, MANAGER, USER)
- Organização padrão
- Data de criação/atualização

### Organizações (Organizations)
- Nome, slug único, descrição
- Dono e membros
- Plano (FREE, STARTER, PROFESSIONAL, ENTERPRISE)
- Limite de usuários

### Plantações (Plantations)
- Cultura, área (hectares)
- Datas de plantio e colheita esperada
- Status (PLANNING, ACTIVE, HARVESTING, COMPLETED)
- Relacionada a despesas e colheitas

### Despesas (Expenses)
- Categoria (SEEDS, FERTILIZER, PESTICIDE, LABOR, etc)
- Valor, data, recibo
- Associada a plantação (opcional)

### Colheitas (Harvests)
- Quantidade, unidade
- Data da colheita
- Receita
- Associada a plantação

### Animais (Animals)
- Tipo, raça, quantidade
- Data de aquisição
- Status (ACTIVE, SOLD, DECEASED)

### Equipamentos (Equipment)
- Nome, tipo, custo de aquisição
- Status (OPERATIONAL, MAINTENANCE, BROKEN)
- Logs de manutenção

## Fluxos Principais

### 1. Registro e Login
```
1. Usuário acessa /register
2. Preenche formulário (nome, email, senha)
3. Frontend valida com Zod
4. API cria usuário com senha hasheada (bcrypt)
5. API cria organização padrão
6. JWT token é gerado e retornado
7. Token armazenado em cookie
8. Usuário redirecionado para /dashboard
```

### 2. Criar Plantação
```
1. Usuário acessa /dashboard/plantations/new
2. Preenche formulário (cultura, área, datas)
3. Frontend valida com Zod
4. POST /api/plantations com dados
5. API valida novamente
6. Service cria registro no BD
7. Sucesso retornado e usuário redirecionado
```

### 3. Registrar Despesa
```
1. Usuário clica "Registrar Gasto"
2. Preenche formulário (categoria, valor, data)
3. POST /api/expenses
4. API associa à organização do usuário
5. Service cria no BD
6. Dashboard atualizado com nova despesa
```

## Boas Práticas Implementadas

### 1. **Segurança**
- ✅ Senhas hasheadas com bcrypt
- ✅ JWT tokens com expiração
- ✅ Cookies HTTP-only
- ✅ CORS configurado
- ✅ Validação em múltiplas camadas
- ✅ Proteção contra SQL Injection (Prisma)

### 2. **Escalabilidade**
- ✅ Serviços centralizados (fácil de testar)
- ✅ Modelos bem estruturados
- ✅ Preparado para múltiplos tenants
- ✅ Componentes reutilizáveis
- ✅ Tipos TypeScript fortes

### 3. **Manutenibilidade**
- ✅ Código organizado em camadas
- ✅ Nomes descritivos
- ✅ Comentários onde necessário
- ✅ Separação de responsabilidades
- ✅ DRY (Don't Repeat Yourself)

### 4. **Performance**
- ✅ Server Components (Next.js)
- ✅ Caching de sessão
- ✅ Queries otimizadas
- ✅ Lazy loading de componentes

### 5. **Experiência do Usuário**
- ✅ Feedback imediato (Toast)
- ✅ Validação em tempo real
- ✅ Design responsivo
- ✅ Mensagens de erro claras

## Configuração e Variáveis de Ambiente

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/controle_rural"

# JWT
JWT_SECRET="sua-chave-secreta-aqui"

# URLs
NEXT_PUBLIC_API_URL="http://localhost:3000"

# Feature Flags
ENABLE_ANALYTICS="true"
ENABLE_EMAIL_VERIFICATION="false"
```

## Como Escalar o Sistema

### 1. **Adicionar Novo Módulo**
```
1. Criar pasta em /modules/novo-modulo
2. Criar service em /services
3. Criar validação em /lib/validations.ts
4. Criar API route em /app/api
5. Criar componentes em /components
6. Criar página em /app/novo-modulo
```

### 2. **Adicionar Nova Funcionalidade**
```
Exemplo: Sistema de Notificações

1. Estender schema Prisma (notification model)
2. Adicionar methods em NotificationService
3. Criar API endpoints (/api/notifications)
4. Criar componentes de UI
5. Adicionar testes
```

### 3. **Preparar para Produção**
```
- [ ] Configurar PostgreSQL em produção
- [ ] Adicionar variáveis de ambiente seguras
- [ ] Configurar SSL/TLS
- [ ] Implementar rate limiting
- [ ] Adicionar monitoring (Sentry)
- [ ] Configurar backups automáticos
- [ ] Implementar logging centralizado
```

## Tecnologias Utilizadas

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | Next.js | ^16.0 |
| Runtime | Node.js | >=18 |
| Linguagem | TypeScript | ^5.3 |
| Styling | Tailwind CSS | ^3.4 |
| ORM | Prisma | ^5.7 |
| Autenticação | JWT | - |
| Hash | bcryptjs | ^2.4 |
| Validação | Zod | ^3.22 |
| HTTP Client | Axios | ^1.6 |
| Notificações | React Hot Toast | ^2.4 |
| Componentes | Lucide React | ^0.293 |
| Gráficos | Recharts | ^2.10 |

## Próximos Passos Recomendados

1. **Implementar Relatórios**
   - Dashboard com gráficos
   - Relatórios por período
   - Análise de ROI

2. **Sistema de Pagamento**
   - Integração com Stripe
   - Diferentes planos
   - Limites por plano

3. **Notificações**
   - Email de confirmação
   - Alertas de colheita
   - Lembretes de manutenção

4. **Mobile App**
   - React Native
   - Sincronização offline
   - Push notifications

5. **Integrações**
   - API externa para dados climáticos
   - Integração com sistemas de registro de terras
   - Exportação de relatórios

6. **Analytics**
   - Dashboard de métricas
   - Rastreamento de eventos
   - Análise de conversão

## Suporte e Manutenção

Para adicionar novos recursos:
1. Sempre manter a estrutura de camadas
2. Usar services centralizados
3. Validar em múltiplas camadas
4. Escrever testes unitários
5. Documentar mudanças significativas

---

**Desenvolvido com ❤️ para agricultores modernos**
