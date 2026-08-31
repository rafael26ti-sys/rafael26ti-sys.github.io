# Controle Rural Simples

Primeira versão profissional de um sistema web para pequenos e médios produtores rurais organizarem a propriedade sem depender de cadernos e planilhas espalhadas.

## Site

<https://rafael26ti-sys.github.io/>

## Conteúdo desta versão

- página pública de apresentação;
- página de login e criação de conta integrada ao Supabase Auth;
- acesso protegido ao painel, com sessão persistente e opção de sair;
- cadastro com os cargos dono da fazenda, vaqueiro e caseiro;
- perfil público e vínculo do usuário com a propriedade no Supabase;
- saldo, receitas, despesas, animais, tarefas, alertas e clima demonstrativo;
- cadastro e exclusão de receitas e despesas;
- filtro financeiro por mês e tipo;
- gráfico comparativo de receitas e despesas;
- agenda com prioridade, responsável e conclusão de tarefas;
- Agenda compartilhada no Supabase, com tarefas atribuídas ao dono, vaqueiro, caseiro ou à equipe inteira;
- funcionários podem concluir somente tarefas próprias ou destinadas a toda a equipe;
- notificações privadas e em tempo real quando uma nova atividade é atribuída;
- central de avisos com contador, marcação de leitura e atalho para a Agenda;
- cadastro de plantações com área, datas, custos, colheita e situação;
- cadastro de animais com identificação, raça, peso, vacinação e saúde;
- controle de estoque com categorias, entradas, saídas, estoque mínimo e alertas de reposição;
- controle de máquinas e equipamentos com horas trabalhadas, combustível, manutenções, situação e custos de conserto;
- registros de uso, abastecimento e manutenção com alertas de vencimento;
- relatórios gerenciais com filtro mensal, resultado financeiro, gastos por categoria e resumos de produção, animais, estoque e máquinas;
- impressão do relatório ou salvamento em PDF pelo navegador;
- clima em tempo real por cidade, com condições atuais e previsão para sete dias;
- alertas automáticos de tempestade, chuva forte, geada, vento e tempo seco;
- navegação responsiva para celular, tablet e computador;
- dados do Financeiro salvos no Supabase, isolados por fazenda e disponíveis somente ao dono;
- página Equipe exclusiva do dono, com convites por código, escolha de cargo, validade e cancelamento;
- lista de membros da propriedade, com alteração de cargo e ativação ou desativação de acesso;
- plantações, animais, estoque e máquinas ainda salvos no navegador por `localStorage`.
- edição dos registros de finanças, tarefas, plantações, animais, estoque e máquinas.

## Arquivos

```text
.
├── assets/
│   └── hero-fazenda.jpg
├── app.js
├── auth.js
├── auth-guard.js
├── index.html
├── landing.js
├── login.html
├── painel.html
├── supabase-client.js
├── supabase/migrations/
├── README.md
└── styles.css
```

## Executar localmente

```bash
python3 -m http.server 8080
```

Depois acesse <http://localhost:8080>.

## Autenticação

As contas são criadas pelo Supabase Auth e os dados de identificação ficam em `public.profiles`. O dono cria uma propriedade e gera códigos na página **Equipe**; vaqueiros e caseiros entram usando o código recebido. O painel exige uma sessão válida.

Para permitir acesso imediato sem confirmação por e-mail, desative **Confirm email** em **Authentication → Providers → Email** no painel do Supabase.

## Limites atuais

As contas, os vínculos com a propriedade, os registros financeiros, a Agenda e as notificações já ficam no Supabase. Plantações, animais, estoque e máquinas ainda ficam somente neste navegador. Os registros locais anteriores de finanças e tarefas são preservados como cópia, mas não são enviados automaticamente ao banco. As notificações desta versão aparecem dentro do sistema; avisos com o navegador fechado ficam para uma etapa futura. O clima depende de conexão com a internet e os alertas automáticos não substituem avisos oficiais. O formulário de contato ainda não envia mensagens.
