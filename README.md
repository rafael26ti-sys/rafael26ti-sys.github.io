# Controle Rural Simples

Dashboard responsivo para pequenos e médios produtores rurais acompanharem safra, atividades, estoque e finanças em uma única tela.

## Site

<https://rafael26ti-sys.github.io/>

## Funcionalidades desta versão

- indicadores automáticos de receitas, despesas, lucro e atividades pendentes;
- cadastro rápido de receita, despesa e atividade;
- pesquisa nos últimos registros;
- exclusão com confirmação;
- navegação entre os módulos planejados no PRD;
- menu responsivo para celular, tablet e computador;
- dados demonstrativos salvos somente no navegador com `localStorage`;
- interface sem dependências externas.

## Arquivos

```text
.
├── docs/
│   └── arquitetura.md
├── index.html
├── README.md
├── script.js
└── styles.css
```

## Executar localmente

```bash
python3 -m http.server 8080
```

Depois acesse <http://localhost:8080>.

## Importante

Esta versão é um protótipo funcional. Não use para informações reais ou sensíveis: autenticação, banco PostgreSQL/Supabase e Row Level Security ainda serão implementados nas próximas etapas do PRD.

