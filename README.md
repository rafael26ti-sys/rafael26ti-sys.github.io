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
- dados salvos no navegador por `localStorage`.

## Arquivos

```text
.
├── assets/
│   └── hero-fazenda.jpg
├── app.js
├── index.html
├── landing.js
├── painel.html
├── README.md
└── styles.css
```

## Executar localmente

```bash
python3 -m http.server 8080
```

Depois acesse <http://localhost:8080>.

## Limites atuais

Esta versão é uma demonstração front-end. Os dados ficam somente no navegador. Login, banco de dados, previsão do tempo em tempo real, envio real do formulário e geração de PDF serão implementados em etapas futuras.

Não use dados pessoais, financeiros ou produtivos reais nesta versão.
