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
- prontuário cronológico por animal, com vacinas, medicamentos, pesagens e ocorrências de saúde;
- atualização automática do peso, da próxima vacinação e dos alertas a partir do prontuário;
- plantações e animais compartilhados pelo Supabase entre os membros da propriedade;
- permissões por cargo: caseiro atualiza plantações, vaqueiro atualiza animais e o dono administra ambos;
- controle de estoque compartilhado no Supabase, com categorias, entradas, saídas, estoque mínimo e alertas de reposição;
- controle de máquinas e equipamentos compartilhado no Supabase, com horas trabalhadas, combustível, manutenções, situação e custos de conserto;
- histórico seguro de movimentações do estoque e de uso, abastecimento e manutenção das máquinas;
- relatórios gerenciais com filtro mensal, resultado financeiro, gastos por categoria e resumos de produção, animais, estoque e máquinas;
- impressão do relatório ou salvamento em PDF pelo navegador;
- clima em tempo real por cidade, com condições atuais e previsão para sete dias;
- alertas automáticos de tempestade, chuva forte, geada, vento e tempo seco;
- navegação responsiva para celular, tablet e computador;
- dados do Financeiro, Agenda, Plantações, Animais, Estoque e Máquinas salvos no Supabase e isolados por fazenda;
- página Equipe exclusiva do dono, com convites por código, escolha de cargo, validade e cancelamento;
- lista de membros da propriedade, com alteração de cargo e ativação ou desativação de acesso;
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

As contas, os vínculos com a propriedade e todos os módulos operacionais ficam no Supabase. Ao conectar um módulo pela primeira vez, registros reais anteriores do navegador são migrados automaticamente; os dados demonstrativos não são enviados. O dono pode excluir qualquer registro; o caseiro administra Plantações, Estoque e Máquinas; o vaqueiro administra Animais e o prontuário do rebanho, além de poder registrar movimentações de estoque e atividades das máquinas. Todos os membros ativos podem consultar o histórico dos animais, mas somente o dono pode excluir entradas. As notificações desta versão aparecem dentro do sistema; avisos com o navegador fechado ficam para uma etapa futura. O clima depende de conexão com a internet e os alertas automáticos não substituem avisos oficiais. O formulário de contato ainda não envia mensagens.
