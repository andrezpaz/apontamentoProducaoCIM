# CIM

Sistema web para apoio ao acompanhamento de producao, fila de maquinas, componentes de OPs e indicadores operacionais do processo produtivo.

O projeto centraliza informacoes vindas do Iniflex/Oracle, dados importados para MySQL e integracoes auxiliares como APIs internas, geracao de relatorios e painel Autoflex/MES.

## O que o sistema faz

- Exibe a fila de producao por recurso/maquina.
- Permite navegar entre etapas e recursos disponiveis na fila.
- Destaca OPs com avisos operacionais, como produto novo e reclamacao de cliente.
- Mostra componentes necessarios para cada OP e enderecos/pallets disponiveis.
- Identifica pallets em consumo interno como consumidos.
- Exibe perfil de cores do item.
- Gera/abre relatorio da OP e relatorio de producao da OP.
- Abre links externos de checklist e consumo de componentes.
- Mostra indicadores de producao do turno atual.
- Integra dados de maquinas do Autoflex/MES via WebSocket.
- Mantem telas responsivas para computadores, tablets e smartphones usados na operacao.

## Tecnologias

- Node.js
- Express
- EJS
- MySQL, via `mysql2`
- Oracle, via `oracledb`
- Axios
- Socket.IO
- WebSocket (`ws`)
- PM2
- Python para rotinas de importacao
- HTML/CSS/JavaScript no frontend

## Estrutura principal

```text
index.js                  Aplicacao Express, rotas, integracoes Oracle e MES
db.js                     Consultas e operacoes MySQL
queriesOracle.js          Consultas Oracle usadas por relatorios e APIs
views/                    Telas EJS
styles/cim-theme.css      Tema visual compartilhado
styles/fila.css           Estilos especificos da tela de fila
scripts/                  Rotinas de importacao/exportacao e scripts frontend
images/                   Imagens, icones e imagens de itens
files/                    PDFs, manifests e arquivos servidos pelo sistema
ecosystem.config.js       Configuracao PM2
```

## Telas e rotas importantes

- `/fila/:recurso`  
  Tela principal da fila de producao do recurso.

- `/fila_tipo_recurso/:tipo_recurso`  
  Lista recursos disponiveis por tipo de recurso.

- `/componentes/:op/:etapa/:recurso`  
  Detalhes dos componentes da OP e enderecos/pallets.

- `/perfilcores/:item`  
  Perfil de cores do item.

- `/gerarRelProducaoOP?op=...&etapa=...`  
  Relatorio de producao da OP.

- `/consultaProducaoTurnoAtual?tipo_recurso=...&recurso=...`  
  Indicador de producao do turno atual.

- `/painelAutoflex?recurso=...`  
  Painel com dados do Autoflex/MES.

- `/apontamento`  
  Tela de apontamento manual.

## Tela de fila

A fila e uma das telas principais do sistema. Ela mostra OPs programadas por recurso e traz:

- seletores de etapa e recurso;
- dados de programacao da OP;
- peso e quantidade;
- item e descricao;
- previsao de entrega;
- cores e velocidade, quando aplicavel;
- imagens do item;
- perfil de cores;
- componentes;
- acoes de OP, checklist, consumo e relatorio de producao.

A tela tambem trata avisos por OP usando o campo `tipo_aviso_op`:

```text
0 ou vazio  Sem aviso
1           Produto Novo
2           Reclamacao de Cliente
```

## Importacao de dados

As rotinas em `scripts/` importam dados exportados do Iniflex para tabelas MySQL usadas pela aplicacao.

Exemplo principal:

```text
scripts/importIniflex.py
```

Esse script le o arquivo `CIMINIFLEX.csv`, limpa a tabela `pcpfila` e insere os dados atualizados de fila, incluindo informacoes como recurso, etapa, OP, item, programacao, quantidade, peso, MRP, velocidade e avisos da OP.

Outros arquivos SQL e scripts Python na pasta `scripts/` apoiam exportacoes e importacoes de componentes, perfil de cores, imagens e dados relacionados.

## Configuracao

O projeto depende de configuracoes locais para conexoes e integracoes.

Arquivos esperados:

```text
.env
connectionsConfig.json
scripts/.env
```

Variaveis usadas pelo Oracle no Node:

```text
DB_USER
DB_PASS
DB_HOST
```

Variaveis usadas por scripts Python de importacao:

```text
MYSQL_HOST
MYSQL_DB
MYSQL_USER
MYSQL_PASS
PATH_IMPORT_CSV
```

O arquivo `connectionsConfig.json` e usado por `db.js` e por rotas que montam URLs externas, como fila, checklist, consumo e API do Iniflex.

## Execucao

Instale as dependencias:

```bash
npm install
```

Execucao direta:

```bash
node index.js
```

Execucao com PM2:

```bash
pm2 start ecosystem.config.js
```

O servidor inicia:

```text
HTTPS: porta 8000
HTTP:  porta 8080
```

Observacao: o HTTPS usa certificados configurados no caminho:

```text
/etc/letsencrypt/live/cim.bazei.com.br/
```

## Dependencias externas

- Banco MySQL com tabelas locais do CIM.
- Banco Oracle/Iniflex.
- Oracle Instant Client configurado em `/opt/oracle/instantclient_21_8/`.
- APIs internas configuradas em `connectionsConfig.json`.
- Autoflex/MES em `autoflex.bazei.com.br:7000`.
- Certificados SSL para execucao HTTPS em producao.

## Observacoes de manutencao

- O visual compartilhado deve ficar em `styles/cim-theme.css`.
- Ajustes especificos da fila devem ficar em `styles/fila.css`.
- Evite colocar CSS inline nas views, salvo excecoes pontuais geradas por dados.
- A tela de fila e muito usada em diferentes resolucoes; alteracoes nela devem ser testadas em desktop, tablet e smartphone.
- Alteracoes em dados da fila normalmente envolvem `scripts/importIniflex.py`, `db.js`, `index.js` e `views/fila.ejs`.

