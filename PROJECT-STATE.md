# LeadFlow Project State

## Snapshot

**Atualizado em:** 2026-10-14  
**Branch de referência:** `main`  
**Objetivo atual:** transformar o LeadFlow em um CRM SaaS multiempresa pronto para uso real, com Iluminar como primeira operação e uma agência como próximo ambiente de teste.

A verificação empresarial da Meta é um bloqueio externo para alguns testes finais de Meta/WhatsApp, mas **não deve bloquear o restante do desenvolvimento**.

---

## Estratégia de produto

- LeadFlow é um SaaS independente.
- Uma única base Supabase atende múltiplas organizações.
- Isolamento por `organization_id` + RLS.
- Papéis previstos: `owner`, `admin`, `member`.
- Iluminar é a primeira organização real.
- Cada cliente deve ter suas próprias integrações e regras de automação.
- Custos variáveis de canais externos devem ficar isolados por organização sempre que possível.
- WhatsApp deve ser um módulo configurável por empresa, não um comportamento global fixo.

---

## Stack atual

- vinext / App Router
- React + TypeScript
- CSS Modules
- Cloudflare Workers
- Supabase PostgreSQL
- Supabase Auth
- Supabase RLS
- Meta Graph API
- WhatsApp Cloud API
- GitHub
- Cloudflare deploy via `npm run deploy`

---

## Rotas principais atuais

### Públicas
- `/` → redireciona para `/login`
- `/login`
- `/f/iluminar-orcamento`
- `/formulario/demo` → redirect legado
- `/sucesso`
- `/privacidade`

### Painel
- `/painel`
- `/painel/leads`
- `/painel/leads/novo`
- `/painel/leads/[id]`
- `/painel/clientes`
- `/painel/formularios`
- `/painel/configuracoes`

### APIs / integrações
- `/api/forms/[slug]/submit`
- `/api/integrations/meta/connect`
- `/api/integrations/meta/callback`
- `/api/integrations/meta/finalize`
- `/api/webhook/meta`
- `/api/webhook/whatsapp`

---

## Banco de dados / multi-tenant

### Concluído
- Schema principal no Supabase.
- Organizações e membros.
- Perfis.
- Serviços.
- Formulários, etapas e campos.
- Pipelines e etapas.
- Contatos.
- Leads.
- Form submissions.
- Activities / histórico.
- RLS por organização.
- Bootstrap da Iluminar.
- Integrações e credenciais separadas.
- Sessões temporárias OAuth.
- Deduplicação de eventos externos do Meta Lead Ads.

### Fundação WhatsApp já criada
- `whatsapp_conversations`
- `whatsapp_messages`
- `notification_rules`
- `notification_jobs`
- RLS/grants específicos.
- Idempotência de mensagens.
- Estrutura de janela de atendimento de 24h.
- Estrutura para status `queued/sent/delivered/read/failed/received`.

Migrations mais recentes confirmadas:
- `20260928000000_create_integrations_table.sql`
- `20260928000001_create_oauth_sessions.sql`
- `20260929000000_create_external_lead_events.sql`
- `20261001000000_create_whatsapp_foundation.sql`

---

## CRM principal — estado atual

### Dashboard
- Dados reais do Supabase.
- Leads do dia.
- Novos leads.
- Leads em negociação.
- Fechados.
- Valor potencial.
- Resumo do pipeline.
- Leads recentes.

### Leads
- Listagem real do Supabase.
- Busca.
- Filtro por etapa.
- Visualização em lista.
- Visualização em Kanban.
- Drag-and-drop entre etapas.
- Registro de atividade ao alterar etapa.
- Criação manual de lead.
- Criação via formulário público.
- Origem.
- Urgência.
- Valor potencial.
- Serviço.
- Responsável.
- Observações internas.
- Histórico de atividades.
- Respostas completas do formulário.
- Edição da oportunidade.
- Botão atual de WhatsApp abre `wa.me` — ainda não é chat nativo do CRM.

### Contatos
- Lista real de contatos.
- Pesquisa.
- Contagem de oportunidades por contato.

### Formulários
- Formulários reais do Supabase.
- Contagem de respostas.
- Formulário público da Iluminar funcional.
- UTM / gclid / fbclid preservados no fluxo público.
- Pré-seleção de serviço/problema via URL.

### Usuários / organização
- Login com Supabase Auth.
- Painel protegido.
- Perfil do usuário.
- Organização atual.
- Leitura de membros e papéis.
- Logout.
- RLS multiempresa já é a base de segurança.

---

## Meta Lead Ads

### Implementado
- OAuth connect/callback/finalize.
- Armazenamento seguro de credenciais no backend.
- Webhook GET de verificação.
- Validação de assinatura do POST.
- Normalização dos campos de lead.
- Deduplicação de eventos.
- Criação de contato/lead/atividade.
- Persistência de IDs externos.
- Tratamento de retries/idempotência.

### Bloqueio externo
- Verificação empresarial/App Review da Meta ainda em processo.
- Teste completo com páginas/clientes externos depende da aprovação/permissões finais.

O código não deve ser refeito por causa desse bloqueio; apenas validar end-to-end quando a Meta liberar.

---

## WhatsApp — estado atual

### Concluído
- Migration/fundação de banco aplicada.
- `lib/whatsapp/send-message.ts` criado.
- `lib/whatsapp/send-template.ts` criado.
- `app/api/webhook/whatsapp/route.ts` criado.
- GET de verificação do webhook.
- POST com validação de assinatura.
- Webhook foi verificado no painel da Meta.
- Estrutura preparada para conversas, mensagens, regras e jobs.

### Ainda NÃO concluído
- O webhook de WhatsApp na `main` ainda não persiste mensagens/status.
- A `main` não contém `lib/whatsapp/webhook.ts`.
- Pode existir uma versão local não commitada desse arquivo; verificar com `git status --short` antes de continuar.
- Configurações ainda exibem WhatsApp como “Em breve”.
- Lead detail ainda usa `wa.me`, não envio nativo.
- Não existe Inbox `/painel/conversas`.
- Não existe processamento real de `sent/delivered/read/failed` no banco.
- Não existe associação automática conversa ↔ contato ↔ lead em produção.
- Não existe criação/processamento de `notification_jobs`.
- Não existe regra ativa de “lead urgente → avisar equipe”.
- Não existe regra configurável de “todo novo lead → mensagem automática ao cliente”.
- Cloudflare Queue ainda não está configurada.

---

## Legal / publicação

- Política de Privacidade pública existe.
- Login e Política de Privacidade identificam o operador legal do LeadFlow.
- Ajuste feito para deixar clara a relação entre o produto LeadFlow e a empresa responsável.
- Não armazenar segredos no GitHub.
- Tokens Meta/WhatsApp devem permanecer somente em secrets/credenciais backend.

---

# Roadmap para concluir um CRM forte

## P0 — terminar antes de chamar de CRM pronto para teste sério

### 1. WhatsApp operacional dentro do CRM
- Finalizar `lib/whatsapp/webhook.ts`.
- Processar inbound messages.
- Processar `sent/delivered/read/failed`.
- Deduplicar corretamente.
- Atualizar janela de 24h.
- Resolver contato/conversa por organização.
- Conectar processador à rota pública.
- Criar endpoints seguros para envio.
- Persistir outbound messages.
- Trocar `wa.me` por envio nativo quando houver integração ativa.
- Criar Inbox `/painel/conversas`.
- Exibir não lidas, responsável, status e histórico.
- Templates fora da janela de 24h.
- Regras de notificação configuráveis por organização.
- Exemplo Iluminar: somente lead urgente → alerta interno.
- Exemplo cliente B: todo lead criado → resposta automática.

### 2. Robustez operacional
- Processar `notification_jobs`.
- Retry seguro e idempotente.
- Adicionar Cloudflare Queue ou worker/outbox equivalente.
- Falha do WhatsApp nunca pode impedir a criação do lead.
- Logs seguros sem PII/tokens.
- Revisar concorrência de `unread_count`.
- Impedir regressão de status de mensagem (`read -> delivered`, etc.).

### 3. Usuários e onboarding
- Tela/fluxo de convite de membros.
- Criar/remover membros.
- Alterar papéis owner/admin/member com regras seguras.
- Cadastro público/self-service do SaaS.
- Criar organização automaticamente para novo owner.
- Criar pipeline inicial automaticamente.
- Fluxo de recuperação de senha.

---

## P1 — recursos que fazem o CRM ficar realmente bom no dia a dia

### Tarefas e follow-up
- Próxima ação por lead.
- Data/hora de follow-up.
- Lembretes.
- Tarefas atribuídas a usuários.
- Visão “Hoje / Atrasadas / Próximas”.
- Histórico da tarefa no lead.

### Pipeline configurável
- Criar/editar/reordenar etapas.
- Mais de um pipeline por organização.
- Marcar etapas de ganho/perda.
- Motivo de perda.
- Probabilidade/forecast opcional.

### Contatos 360°
- Página de detalhe do contato.
- Todas as oportunidades daquele contato.
- Conversas WhatsApp.
- Notas.
- Atividades.
- Deduplicação por telefone/e-mail.
- Merge de contatos duplicados.

### Formulários
- Criador de formulário no painel.
- Criar/editar campos e etapas sem código.
- Ativar/desativar.
- Copiar link.
- Preview.
- Mapeamento do formulário para serviço/pipeline/origem.

### Relatórios
- Conversão por etapa.
- Conversão por origem.
- Conversão por serviço.
- Conversão por responsável.
- Tempo médio até primeiro contato.
- Tempo por etapa.
- Ganhos/perdas.
- Valor ganho.
- Períodos e filtros.
- Exportação CSV.

### Busca e produtividade
- Busca global.
- Filtros avançados.
- Ordenação.
- Ações em massa.
- Atalhos rápidos.
- Campos personalizados.

---

## P2 — SaaS comercial

### Planos e limites
- Tabela de planos.
- Assinaturas.
- Limite de usuários.
- Limite de automações.
- Limite/uso de mensagens.
- Controle de features por plano.
- Página de uso/custos por organização.

### Integrações
- Google/Calendar.
- E-mail.
- Webhooks genéricos.
- API pública do LeadFlow.
- Importação CSV.
- Outras fontes de lead.

### Automação
- Motor de gatilho + condição + ação.
- Ex.: lead criado.
- Ex.: urgência alta.
- Ex.: etapa alterada.
- Ex.: sem resposta por X horas/dias.
- Ações: WhatsApp, tarefa, mudar etapa, atribuir usuário.

### IA — depois do CRM estar sólido
- Resumo de conversas.
- Sugestão de resposta.
- Qualificação de lead.
- Classificação de intenção.
- Follow-up sugerido.
- Nunca deixar IA bloquear operações básicas do CRM.

---

## Dívidas técnicas / segurança a revisar

- `.env.example` ainda não documenta `WHATSAPP_VERIFY_TOKEN`.
- `wrangler.jsonc` ainda não possui bindings de Queue.
- WhatsApp inbound processor não está na `main`.
- Confirmar que qualquer token anteriormente exposto foi rotacionado.
- Revisar logs existentes para evitar PII.
- Revisar páginas que fazem writes diretamente do client e confirmar que RLS cobre todos os casos.
- Criar testes automatizados para fluxos críticos:
  - criação de lead;
  - RLS multiempresa;
  - mudança de etapa;
  - Meta dedupe;
  - WhatsApp dedupe/status;
  - notification jobs.
- Criar estratégia de soft delete/arquivamento para dados importantes.
- Criar recuperação/backup operacional para produção.

---

# Ordem recomendada a partir de agora

1. **Finalizar o processador do webhook WhatsApp e colocar na main.**
2. **Conectar inbound/status à rota e testar com payloads simulados.**
3. **Criar envio nativo de WhatsApp pelo lead.**
4. **Criar Inbox de conversas.**
5. **Criar notification rules/jobs + regra de urgência da Iluminar.**
6. **Implementar tarefas/follow-up.**
7. **Completar gestão de equipe/onboarding.**
8. **Pipeline configurável.**
9. **Contato 360°.**
10. **Form builder.**
11. **Relatórios/exportações.**
12. **Planos/limites/uso.**
13. **Integrações adicionais e IA.**

---

## Regra de trabalho

Durante horário comercial:
- executar uma tarefa por vez;
- prompts simples e literais para agentes;
- build antes de commit;
- commit/push por bloco funcional;
- não misturar refactor grande com feature.

Antes de cada novo bloco:

```powershell
git status --short
git pull
```

Depois do bloco:

```powershell
npm run build
git status --short
git add .
git commit -m "mensagem objetiva"
git push
npm run deploy
```

Não usar `git add .` se houver arquivos inesperados no `git status`; revisar primeiro.
