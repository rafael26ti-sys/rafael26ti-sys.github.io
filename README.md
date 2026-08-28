# Controle Rural Simples

Primeira versão profissional de um sistema web para pequenos e médios produtores rurais organizarem a propriedade sem depender de cadernos e planilhas espalhadas.

## Site

<https://rafael26ti-sys.github.io/>

## Conteúdo desta versão

- página pública de apresentação;
- painel com acesso direto, sem cadastro ou login;
- saldo, receitas, despesas, animais, tarefas, alertas e clima demonstrativo;
- cadastro e exclusão de receitas e despesas;
- filtro financeiro por mês e tipo;
- gráfico comparativo de receitas e despesas;
- agenda com prioridade, responsável e conclusão de tarefas;
- cadastro de plantações com área, datas, custos, colheita e situação;
- cadastro de animais com identificação, raça, peso, vacinação e saúde;
- navegação responsiva para celular, tablet e computador;
- dados demonstrativos salvos no navegador por `localStorage`.

## Arquivos

```text
.
├── assets/
│   └── hero-fazenda.jpg
├── app.js
├── index.html
├── landing.js
├── painel.html
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

Esta versão não possui contas nem separação de usuários. Os registros de finanças, agenda, plantações e animais ficam somente neste navegador. O clima é demonstrativo e o formulário de contato ainda não envia mensagens.

Não use dados pessoais, financeiros ou produtivos reais nesta versão.
