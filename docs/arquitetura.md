# Arquitetura técnica — Controle Rural Simples

## 1. Objetivo desta etapa

Este documento conclui o **Passo 1 — Arquitetura** do PRD. Ele define a base técnica que orientará as próximas etapas sem antecipar banco de dados, autenticação ou funcionalidades do MVP.

## 2. Decisões principais

| Área | Escolha | Motivo |
|---|---|---|
| Linguagem | TypeScript | Tipagem compartilhada e menor risco de erros entre front-end e back-end |
| Interface | React com Next.js App Router | Roteamento, renderização e API no mesmo projeto |
| Estilos | Tailwind CSS | Desenvolvimento rápido, consistente e responsivo |
| Back-end do MVP | Route Handlers do Next.js | Menor complexidade operacional para um projeto educacional/solo |
| Banco planejado | PostgreSQL via Supabase | Banco relacional gerenciado, adequado aos vínculos entre propriedade, safra e financeiro |
| Autenticação planejada | Supabase Auth | Sessões e recuperação de senha integradas ao banco e ao RLS |
| Validação | Zod | Contratos únicos para formulários, serviços e API |
| Hospedagem futura | Vercel + Supabase | Compatibilidade com Next.js e baixo custo inicial |

O GitHub Pages será usado apenas para a página pública de acompanhamento. Ele não substitui a hospedagem da aplicação full-stack.

## 3. Visão das camadas

```text
Interface (páginas e componentes)
              ↓
Casos de uso (serviços da aplicação)
              ↓
Domínio (tipos e regras de negócio)
              ↓
Acesso a dados (repositórios)
              ↓
Supabase (PostgreSQL, Auth e Storage)
```

### Interface

Responsável por páginas, formulários, feedback ao usuário, estados de carregamento e acessibilidade. Não contém consultas SQL nem regras financeiras.

### Aplicação

Orquestra casos de uso como criar safra, registrar despesa e calcular o resultado. Recebe dados validados e chama interfaces de repositório.

### Domínio

Concentra tipos, regras e cálculos que não dependem de React, Next.js ou Supabase. Exemplos: lucro = receitas − despesas; quantidade de estoque não pode ficar negativa.

### Dados

Implementa os contratos de repositório e isola o acesso ao Supabase. Componentes nunca acessam o banco diretamente.

## 4. Estrutura de pastas planejada

```text
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── recuperar-senha/
│   ├── (painel)/
│   │   ├── dashboard/
│   │   ├── propriedades/
│   │   ├── talhoes/
│   │   ├── culturas/
│   │   ├── safras/
│   │   ├── atividades/
│   │   ├── estoque/
│   │   ├── financeiro/
│   │   └── relatorios/
│   ├── api/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── layout/
│   ├── forms/
│   ├── feedback/
│   └── ui/
├── domain/
│   ├── entities/
│   ├── rules/
│   └── repositories/
├── services/
│   ├── propriedades/
│   ├── safras/
│   ├── estoque/
│   └── financeiro/
├── data/
│   ├── repositories/
│   └── supabase/
├── schemas/
├── hooks/
├── lib/
└── types/
tests/
├── unit/
└── integration/
```

Os módulos que não pertencem ao MVP só serão adicionados quando entrarem na fase correspondente do roadmap.

## 5. Padrão de componentes

### Componentes de interface

- Devem receber dados por propriedades e emitir eventos claros.
- Não devem conhecer consultas, tabelas ou detalhes do Supabase.
- Devem possuir estados de carregamento, vazio, sucesso e erro quando aplicável.
- Devem usar HTML semântico, contraste adequado e navegação por teclado.
- Devem funcionar a partir de 360 px, conforme o PRD.

### Componentes de formulário

- Um schema Zod define os dados aceitos.
- Mensagens de validação devem ser simples e específicas.
- Datas e valores monetários são formatados para `pt-BR` apenas na apresentação.
- Valores monetários são transportados e armazenados sem depender de texto formatado.

### Componentes compartilhados

Um componente só entra em `components/ui` quando for realmente reutilizado. Componentes específicos permanecem próximos do módulo que os utiliza.

## 6. Camada de serviços

Cada caso de uso será uma função ou serviço pequeno, com dependências explícitas. Exemplo conceitual:

```ts
type RegistrarDespesaInput = {
  propriedadeId: string;
  safraId?: string;
  descricao: string;
  valorEmCentavos: number;
  data: string;
};

async function registrarDespesa(
  input: RegistrarDespesaInput,
  despesas: DespesasRepository,
): Promise<Despesa> {
  // validar regra de negócio e persistir pelo contrato de repositório
}
```

Regras:

- A camada de serviço não retorna objetos HTTP.
- Route Handlers convertem HTTP em entrada do serviço e a saída em resposta.
- Erros esperados usam códigos conhecidos, como `VALIDATION_ERROR`, `NOT_FOUND` e `CONFLICT`.
- Logs não devem conter senha, token ou dados pessoais desnecessários.

## 7. Fluxo de uma requisição

1. A interface coleta os dados e faz a validação inicial.
2. O Route Handler valida novamente a entrada.
3. O serviço executa as regras do caso de uso.
4. O repositório acessa o Supabase respeitando o usuário e a propriedade.
5. A resposta retorna em formato consistente.
6. A interface apresenta sucesso ou erro em linguagem simples.

Formato planejado para erros da API:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Confira os campos informados.",
    "fields": {}
  }
}
```

## 8. Segurança desde a base

- A autorização será aplicada no servidor e reforçada por Row Level Security.
- Toda entidade operacional deverá possuir vínculo com uma propriedade.
- Entradas serão validadas no cliente e novamente no servidor.
- Consultas serão parametrizadas; SQL não será montado por concatenação.
- Segredos ficarão em variáveis de ambiente e nunca no repositório.
- Exclusões com dependências exigirão confirmação ou serão bloqueadas.
- Alterações financeiras sensíveis terão trilha de auditoria em fase posterior.

## 9. Convenções

- Código, pastas e nomes técnicos: português sem acentos, em `camelCase` ou `kebab-case` conforme o contexto.
- Componentes React: `PascalCase`.
- Funções e variáveis: `camelCase`.
- Tabelas e colunas: `snake_case`.
- IDs: UUID.
- Dinheiro: inteiro em centavos na aplicação e `numeric` no banco, com conversão controlada.
- Datas: ISO 8601 entre camadas; apresentação em `pt-BR`.
- Commits: mensagens curtas descrevendo o resultado da alteração.

## 10. Estratégia de testes

- Testes unitários para cálculos de lucro, produtividade e movimentação de estoque.
- Testes de integração para serviços e repositórios.
- Testes dos fluxos críticos: login, criação da hierarquia rural, lançamentos financeiros e estoque.
- O build, a verificação de tipos e os testes devem passar antes de publicar uma versão.

## 11. Limites desta etapa

Este passo não implementa banco, autenticação, dashboard nem cadastros. Esses itens permanecem nas etapas seguintes do PRD. A próxima atividade autorizada é o **Passo 2 — Banco de dados**, com tabelas, campos, tipos e constraints.
