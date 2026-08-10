# Orientações para agentes de desenvolvimento

## Objetivo do projeto

Este repositório contém um MVP Node.js de automação de vendas e marketing com dois fluxos:

- prospecção outbound diária;
- geração recorrente de ideias de conteúdo.

A aplicação executa Express, bot Discord e agendamentos cron no mesmo processo. SQLite é a persistência local. Busca externa começa em modo mock e a IA pode operar em modo mock ou OpenAI.

## Arquitetura

Respeite o fluxo de dependências:

```text
jobs / Discord / scripts
          ↓
        agents
          ↓
       services
       ↙      ↘
repositories  integrations
     ↓          ↓
  SQLite    Discord/OpenAI/Search
```

- Agents orquestram o caso de uso e não acessam APIs ou SQLite diretamente.
- Services contêm regras de negócio e coordenam clients/repositories.
- Repositories concentram SQL, serialização e leitura do banco.
- Integrations encapsulam SDKs e fornecedores externos.
- `src/bootstrap.js` é o único composition root.
- `src/config/env.js` centraliza leitura e validação de ambiente.

Não introduza TypeScript, Docker, Redis, PostgreSQL, filas ou frameworks adicionais sem uma necessidade aprovada.

## Ambiente e comandos

Requisitos: Node.js 22.5 ou superior e npm.

```bash
npm install
npm run db:init
npm test
npm start
```

Diagnósticos externos sem publicação:

```bash
npm run test:openai
npm run test:discord
```

Os comandos abaixo publicam conteúdo no Discord e só devem ser executados quando o usuário autorizar explicitamente:

```bash
npm run job:leads
npm run job:content
```

## Segurança e ações externas

- Nunca mostre, registre ou copie valores de `.env` para respostas, testes, commits ou documentação.
- Ao verificar configuração, use uma leitura que exponha apenas se cada variável está presente, ausente ou com formato inválido.
- Nunca versionar `.env`, arquivos `data/*.sqlite` ou logs de produção.
- Não enviar mensagens ao Discord, consumir APIs pagas em volume, executar deploy, alterar infraestrutura ou iniciar PM2 sem autorização explícita.
- Um teste pontual de credencial deve fazer o menor número possível de chamadas e não deve persistir nem publicar conteúdo.
- Dados obtidos por pesquisa devem manter fontes. Informação não confirmada deve ser `null`; hipóteses devem ser rotuladas como hipóteses.
- Não usar dados mock como leads reais.

## Regras de implementação

- Usar JavaScript, ES Modules, async/await e fetch nativo quando possível.
- Preferir funções pequenas e composição explícita. Não criar classes ou abstrações sem benefício concreto.
- Não espalhar chamadas da OpenAI, Discord ou providers de busca fora de `src/integrations/`.
- Não acessar SQL fora de `src/repositories/` e `src/database/`.
- Toda resposta da IA deve usar schema estruturado e validação local antes do uso.
- Preservar a deduplicação de leads nesta prioridade: CNPJ, domínio, nome+cidade.
- Preservar os status definidos nas constraints das migrações.
- Comentários devem explicar apenas decisões não óbvias.
- Manter mensagens do Discord abaixo do limite por meio do splitter existente.
- Cron interno exige PM2 em `fork` com uma única instância.

## Workflow obrigatório

Antes de editar:

1. Leia `README.md`, `package.json` e os módulos diretamente envolvidos.
2. Execute `git status --short` e preserve alterações existentes do usuário.
3. Localize referências com `rg` antes de renomear contratos ou variáveis.

Depois de editar:

1. Execute `npm test`.
2. Execute `node --check` nos arquivos JavaScript alterados, quando não estiverem cobertos pelos testes.
3. Para mudanças de inicialização, suba a aplicação temporariamente e valide `GET /health`.
4. Para mudanças OpenAI ou Discord, use primeiro os scripts de diagnóstico sem publicação.
5. Informe claramente o que foi validado localmente e o que depende de credenciais ou ação externa.

Nunca faça commit, push, deploy ou descarte mudanças locais sem solicitação explícita.

## Testes

- Testes automatizados devem usar banco temporário, `AI_PROVIDER=mock` e Discord desabilitado.
- Não faça testes automatizados dependerem de rede ou credenciais reais.
- Integrações reais ficam nos scripts manuais `test:openai` e `test:discord`.
- Ao corrigir um bug, adicione um teste de regressão quando o comportamento puder ser reproduzido localmente.

## Critérios de conclusão

Uma alteração só está concluída quando:

- responsabilidades continuam nas camadas corretas;
- segredos e dados locais permanecem ignorados;
- testes automatizados passam;
- `/health` continua respondendo com o contrato documentado;
- erros de configuração são claros;
- nenhuma mensagem ou job externo foi disparado sem autorização;
- README e `.env.example` refletem qualquer nova variável ou comando.
