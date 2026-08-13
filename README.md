# sales-mkt-agent

MVP de automação de vendas e marketing que executa prospecção outbound diária e gera ideias de conteúdo três vezes por semana. A aplicação roda em um único processo Node.js com Express, Discord, SQLite e cron interno.

O projeto inicia com busca e IA em modo mock, portanto pode ser validado sem contratar APIs externas. As empresas do mock são fictícias e os dados não devem ser usados comercialmente.

## Arquitetura

```text
Discord / cron / scripts manuais
             |
          Agents
             |
          Services
       /             \
Repositories      Integrations
     |             /         \
  SQLite      SearchClient   AI Client
                 mock       mock/OpenAI
```

- `agents`: orquestram os passos de cada fluxo.
- `services`: pesquisa, análise, seleção, deduplicação e persistência.
- `repositories`: único ponto de acesso às tabelas SQLite.
- `integrations`: clientes substituíveis para Discord, OpenAI e busca externa.
- `jobs`: execução protegida contra sobreposição e agendamento.
- `bootstrap.js`: composição explícita das dependências.

## Estrutura

```text
sales-mkt-agent/
├── config/icp.json
├── data/.gitkeep
├── logs/.gitkeep
├── prompts/
│   ├── content-ideas.prompt.md
│   ├── lead-research.prompt.md
│   └── lead-score.prompt.md
├── src/
│   ├── agents/
│   ├── config/
│   ├── database/
│   ├── integrations/{discord,openai,search}/
│   ├── jobs/
│   ├── repositories/
│   ├── routes/
│   ├── schemas/
│   ├── scripts/
│   ├── services/
│   ├── utils/
│   ├── app.js
│   ├── bootstrap.js
│   └── server.js
├── test/mvp.test.js
├── .env.example
├── ecosystem.config.cjs
└── package.json
```

## Requisitos

- Node.js 22.5 ou superior
- npm
- Um bot e um servidor privado no Discord para o uso real
- PM2 global na VPS para produção

O SQLite usado é o módulo nativo `node:sqlite`, disponível no Node 22. Não é necessário instalar servidor de banco.

## Instalação

```bash
git clone <url-do-repositorio> sales-mkt-agent
cd sales-mkt-agent
npm install
cp .env.example .env
```

No Windows PowerShell, use `Copy-Item .env.example .env` no lugar de `cp`.

## Configuração

Edite `.env`:

```dotenv
NODE_ENV=development
PORT=3000
HOST=127.0.0.1
APP_TIMEZONE=America/Sao_Paulo
DATABASE_PATH=./data/sales-mkt-agent.sqlite

AI_PROVIDER=mock
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5-mini
OPENAI_INPUT_USD_PER_1M_TOKENS=0.25
OPENAI_CACHED_INPUT_USD_PER_1M_TOKENS=0.025
OPENAI_OUTPUT_USD_PER_1M_TOKENS=2

SEARCH_PROVIDER=mock
TAVILY_API_KEY=

DISCORD_ENABLED=true
DISCORD_TOKEN=
DISCORD_GUILD_ID=
DISCORD_DASHBOARD_CHANNEL_ID=
DISCORD_LEADS_CHANNEL_ID=
DISCORD_CONTENT_CHANNEL_ID=
DISCORD_AGENT_CHANNEL_ID=
DISCORD_LOGS_CHANNEL_ID=
```

Com `AI_PROVIDER=mock`, a chave da OpenAI não é obrigatória. Para usar a API real, troque para `AI_PROVIDER=openai`, informe `OPENAI_API_KEY` e escolha `OPENAI_MODEL`. A integração usa saída estruturada com JSON Schema e uma segunda validação local.

Cada chamada real registra `[OPENAI_USAGE]` com os tokens de entrada, cache, saída, raciocínio, total e o custo estimado em USD. As tarifas acima são valores por 1 milhão de tokens e correspondem ao `gpt-5-mini`; revise-as ao trocar de modelo ou quando a OpenAI alterar os preços.

Informe tokens e chaves sem aspas ou delimitadores como `<` e `>`. O processo rejeita configurações com esses caracteres antes de acessar a API.

Para uma validação inteiramente local, defina `DISCORD_ENABLED=false`. Nesse modo os relatórios são persistidos e registrados no console, mas não enviados.

O ICP é lido em toda execução a partir de `config/icp.json`; alterações não exigem recompilar a aplicação.
`minimumScore` define o corte mínimo de aderência e `dailyLeadLimit` limita quantos leads são persistidos e apresentados em cada execução. O ICP atual procura cinco clínicas odontológicas, escritórios de contabilidade ou escritórios de advocacia por rodada, com score mínimo 75. `segmentKeywords` reconhece variações de segmento vindas do CNAE sem aceitar empresas fora desses nichos.

## Configuração do Discord

1. No Discord Developer Portal, crie uma aplicação e um bot.
2. Ative o intent privilegiado **Message Content Intent**, necessário para o canal `#agente`.
3. Convide o bot para o servidor com permissões para ver canais, ler histórico e enviar mensagens.
4. Crie os canais `#dashboard`, `#leads`, `#conteudo`, `#agente` e `#logs`.
5. Ative o modo desenvolvedor do Discord, copie o ID do servidor e os IDs dos cinco canais usados no `.env`.
6. Preencha o token e os IDs. O token nunca deve ser versionado.

O canal `#dashboard` está reservado para uma etapa futura. No `#agente`, o assistente usa a OpenAI para consultar leads e ideias de conteúdo em linguagem natural. A conversa é separada por usuário, mantém as últimas 20 mensagens no SQLite e pode ser reiniciada com `limpar conversa`. O chat é somente leitura: ele não altera status nem executa jobs.

Valide as credenciais sem publicar mensagens:

```bash
npm run test:openai
npm run test:discord
```

## SQLite e primeiro teste

```bash
npm run db:init
npm test
npm start
```

Com o servidor rodando:

```bash
curl http://localhost:3000/health
```

Resposta esperada:

```json
{
  "status": "ok",
  "service": "sales-mkt-agent",
  "timestamp": "2026-08-10T09:00:00.000Z"
}
```

O timestamp varia a cada requisição.

Endpoints de consulta de leads:

```bash
curl http://localhost:3000/leads
curl http://localhost:3000/leads/1
```

`GET /leads` retorna todos os leads ordenados por score e data de descoberta. `GET /leads/:id` retorna um lead, responde `400` para ID inválido e `404` quando o registro não existe.

Para desenvolvimento com reinício automático:

```bash
npm run dev
```

## Jobs

O outbound possui `DRY_RUN=true` para buscar, enriquecer e pontuar sem persistir leads nem enviar ao Discord. Execucoes sao protegidas por lock ao lado do banco e registradas em `job_runs`. Com Tavily, a homepage oficial de cada candidato e enviada ao Extract antes da analise estruturada.

Use apenas um agendador para cada job. `INTERNAL_LEADS_CRON_ENABLED=true` registra o outbound das 05:00; ao usar cron do Linux para leads, defina-o como `false`. `INTERNAL_CONTENT_CRON_ENABLED=true` mantém a geração de conteúdo no processo PM2.

Agendamentos internos, ambos com `America/Sao_Paulo` por padrão:

- Outbound: todos os dias às 05:00 (`0 5 * * *`).
- Conteúdo: segunda, quarta e sexta às 05:15 (`15 5 * * 1,3,5`).

Execução manual:

```bash
npm run job:leads
npm run job:content
```

O SearchClient mock possui empresas fictícias dos três segmentos do ICP, com portes, sinais e qualidade variados. Cada execução tenta preencher `dailyLeadLimit` com leads que alcancem `minimumScore`, analisando novos candidatos até completar a quantidade ou esgotar os resultados válidos; leads já persistidos não são reapresentados. As ideias mock alternam temas e recebem edições posteriores para que o agendamento continue funcional sem repetir registros.

## Como os agents funcionam

O `OutboundAgent` carrega o ICP, busca candidatos, elimina registros conhecidos, aplica o pré-filtro de segmento, porte, região e sinais negativos, pesquisa e pontua candidatos até obter cinco aprovados, persiste e envia ao Discord. A deduplicação prioriza CNPJ, depois domínio do site e por fim nome+cidade.

O `ContentAgent` carrega o ICP e até mil ideias anteriores, gera uma proposta para cada frente — DoGym, Quanto Deu AI e Profissional/Freelance —, elimina repetições, persiste e envia ao Discord. Cada ideia mantém sua frente identificada no SQLite e na mensagem do canal `#conteudo`.

O `RouterAgent` concentra a interação no `#agente`. Consultas diretas por ID continuam disponíveis, e perguntas livres usam a OpenAI com ferramentas locais somente leitura para pesquisar leads e ideias. O histórico fica no SQLite e não é armazenado pela OpenAI.

## Trocar o SearchClient mock

1. Crie um cliente em `src/integrations/search/`, por exemplo `serper-search.client.js`.
2. Implemente os métodos assíncronos `searchCompanies({ regions, segments })` e `researchCompany(candidate)`.
3. Retorne candidatos no mesmo formato do mock e inclua fontes/evidências nos resultados da pesquisa.
4. Acrescente as credenciais do provider ao `.env.example` e à validação em `src/config/env.js`.
5. Selecione o novo cliente em `src/bootstrap.js` com base em `SEARCH_PROVIDER`.

Nenhum agent ou repository precisa mudar. Ao integrar um provider real, respeite termos de uso, LGPD, limites de requisição e robots.txt. Não trate dados inferidos como confirmados.

## Produção com PM2

Na VPS Ubuntu:

```bash
npm install
npm run db:init
sudo npm install --global pm2
pm2 start ecosystem.config.cjs
pm2 status
pm2 logs sales-mkt-agent
```

O arquivo usa `fork`, uma instância, reinício automático, limite de 300 MB e logs em `logs/`. Cluster não deve ser habilitado, pois duplicaria bot e agendamentos.

Para iniciar automaticamente após reiniciar a VPS:

```bash
pm2 startup
```

Execute o comando com `sudo` exibido pelo PM2 e depois:

```bash
pm2 save
```

Confirme o timezone do sistema:

```bash
timedatectl
sudo timedatectl set-timezone America/Sao_Paulo
```

O job também passa explicitamente o timezone ao `node-cron`, e o PM2 define `TZ` para os logs.

## Checklist de validação

- [ ] `npm install` conclui sem erro.
- [ ] `.env` não está versionado e contém token/IDs válidos.
- [ ] `npm run db:init` cria `data/sales-mkt-agent.sqlite`.
- [ ] `npm test` valida health check, persistência e deduplicação.
- [ ] `npm start` conecta o bot e registra os dois crons.
- [ ] `GET /health` retorna HTTP 200 com o contrato esperado.
- [ ] `npm run job:leads` envia cinco empresas fictícias dentro do ICP ao `#leads` no primeiro banco limpo.
- [ ] `npm run job:content` envia três ideias ao `#conteudo`.
- [ ] Uma mensagem no `#agente` consulta um lead ou ideia existente.
- [ ] Reiniciar a aplicação não cria tabelas duplicadas nem reapresenta leads salvos.

## Próximos passos

1. Implementar um SearchClient real com fontes rastreáveis.
2. Ativar `AI_PROVIDER=openai` e avaliar o modelo econômico escolhido com dados representativos.
3. Adicionar autenticação aos endpoints e criar consultas de conteúdos.
4. Planejar atualização de status com confirmação explícita no `RouterAgent`.
5. Acrescentar retentativas controladas e limites de concorrência para APIs externas.
6. Planejar backup periódico do arquivo SQLite antes de uso contínuo em produção.
