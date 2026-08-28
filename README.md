# Controle Rural Simples

Primeira versão profissional de um sistema web para pequenos e médios produtores rurais organizarem a propriedade sem depender de cadernos e planilhas espalhadas.

## Site

<https://rafael26ti-sys.github.io/>

## Conteúdo desta versão

- página pública de apresentação;
- painel com saldo, receitas, despesas, animais, tarefas, alertas e clima demonstrativo;
- cadastro e exclusão de receitas e despesas;
- filtro financeiro por mês e tipo;
- gráfico comparativo de receitas e despesas;
- agenda com prioridade, responsável e conclusão de tarefas;
- cadastro de plantações com área, datas, custos, colheita e situação;
- cadastro de animais com identificação, raça, peso, vacinação e saúde;
- navegação responsiva para celular, tablet e computador;
- autenticação por e-mail e senha com Supabase Auth;
- cargos de dono, vaqueiro e caseiro;
- convites de equipe gerados pelo dono da propriedade;
- isolamento de acesso com Row Level Security (RLS);
- dados dos módulos demonstrativos salvos no navegador por `localStorage`.

## Arquivos

```text
.
├── assets/
│   └── hero-fazenda.jpg
├── app.js
├── auth.css
├── auth.js
├── equipe.html
├── equipe.js
├── index.html
├── landing.js
├── login.html
├── painel.html
├── session.js
├── supabase-config.js
├── supabase/migrations/
├── README.md
└── styles.css
```

## Executar localmente

```bash
python3 -m http.server 8080
```

Depois acesse <http://localhost:8080>.

## Limites atuais

As contas, propriedades, cargos e convites usam Supabase. Os registros de finanças, agenda, plantações e animais ainda ficam somente no navegador. A persistência desses módulos, clima em tempo real, envio do formulário e PDF serão implementados em próximas etapas.

Não use dados pessoais, financeiros ou produtivos reais nesta versão.
