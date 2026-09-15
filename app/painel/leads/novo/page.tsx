'use client';

import styles from './novo.module.css';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BriefcaseBusiness,
  CircleDollarSign,
  Mail,
  Phone,
  Save,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const SOURCE_OPTIONS = ['WhatsApp', 'Ligação', 'Indicação', 'Instagram', 'Facebook', 'Google', 'Site', 'Outro'];
const URGENCY_OPTIONS = ['Baixa', 'Média', 'Alta'];

interface ServiceOption {
  id: string;
  name: string;
}

function generateProtocol(): string {
  const date = new Date();
  return `LF-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function formatPreviewCurrency(value: string) {
  const parsed = Number(value.replace(',', '.'));
  if (!value.trim() || Number.isNaN(parsed)) return 'A definir';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parsed);
}

export default function NovoLeadPage() {
  const router = useRouter();

  const [services, setServices] = useState<ServiceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [source, setSource] = useState('');
  const [urgency, setUrgency] = useState('Média');
  const [potentialValue, setPotentialValue] = useState('');
  const [notes, setNotes] = useState('');

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchServices() {
      setLoading(true);
      try {
        const supabase = createClient();

        const { data, error } = await supabase
          .from('services')
          .select('id, name, active, sort_order')
          .eq('active', true)
          .order('sort_order', { ascending: true });

        if (error) throw error;
        setServices((data ?? []) as ServiceOption[]);
      } catch (err) {
        console.error('Error loading services:', err);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchServices();
  }, []);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) errors.name = 'Informe o nome do contato.';
    if (!phone.trim()) errors.phone = 'Informe o WhatsApp/Telefone.';
    if (!source) errors.source = 'Selecione a origem.';

    if (potentialValue.trim() && Number.isNaN(Number(potentialValue.replace(',', '.')))) {
      errors.potentialValue = 'Valor potencial inválido.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    setFormError('');
    if (!validate()) return;

    setSaving(true);
    try {
      const supabase = createClient();

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Usuário não autenticado');

      const { data: membershipData, error: membershipError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1);

      if (membershipError) throw membershipError;

      const organizationId = membershipData?.[0]?.organization_id;
      if (!organizationId) throw new Error('Organização não encontrada para o usuário');

      const { data: pipeline, error: pipelineError } = await supabase
        .from('pipelines')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('is_default', true)
        .maybeSingle();

      if (pipelineError) throw pipelineError;
      if (!pipeline) throw new Error('Pipeline padrão não encontrado');

      const { data: stage, error: stageError } = await supabase
        .from('pipeline_stages')
        .select('id')
        .eq('pipeline_id', pipeline.id)
        .eq('key', 'novo')
        .maybeSingle();

      if (stageError) throw stageError;
      if (!stage) throw new Error('Estágio inicial "novo" não encontrado');

      const normalizedPhone = phone.replace(/\D/g, '');

      const { data: existingContact, error: contactLookupError } = await supabase
        .from('contacts')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('phone', normalizedPhone)
        .maybeSingle();

      if (contactLookupError) throw contactLookupError;

      let contactId: string;

      if (existingContact) {
        contactId = existingContact.id;
      } else {
        const { data: newContact, error: createContactError } = await supabase
          .from('contacts')
          .insert({
            organization_id: organizationId,
            name: name.trim(),
            phone: normalizedPhone,
            email: email.trim() || null,
          })
          .select('id')
          .single();

        if (createContactError) throw createContactError;
        contactId = newContact.id;
      }

      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert({
          organization_id: organizationId,
          contact_id: contactId,
          service_id: serviceId || null,
          pipeline_id: pipeline.id,
          stage_id: stage.id,
          assigned_user_id: user.id,
          title: name.trim(),
          source,
          urgency,
          potential_value: potentialValue.trim() === '' ? null : Number(potentialValue.replace(',', '.')),
          notes: notes.trim() || null,
          form_id: null,
          protocol: generateProtocol(),
        })
        .select('id')
        .single();

      if (leadError) throw leadError;

      const { error: activityError } = await supabase
        .from('activities')
        .insert({
          organization_id: organizationId,
          lead_id: lead.id,
          actor_user_id: user.id,
          type: 'lead_created_manual',
          data: { source },
        });

      if (activityError) throw activityError;
      router.push(`/painel/leads/${lead.id}`);
    } catch (err) {
      console.error('Error creating lead:', err);
      setFormError('Não foi possível cadastrar o lead.');
    } finally {
      setSaving(false);
    }
  };

  const selectedService = useMemo(
    () => services.find(service => service.id === serviceId)?.name || 'Sem serviço definido',
    [services, serviceId]
  );

  return (
    <main className={styles.container}>
      <div className={styles.topBar}>
        <button type="button" className={styles.backButton} onClick={() => router.push('/painel/leads')}>
          <ArrowLeft size={16} />
          Leads
        </button>
      </div>

      <header className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}>NOVA OPORTUNIDADE</span>
          <h1>Novo lead</h1>
          <p>Cadastre uma oportunidade manualmente e coloque ela direto no pipeline.</p>
        </div>
      </header>

      {loading ? (
        <div className={styles.message}>Carregando dados do workspace...</div>
      ) : loadError ? (
        <div className={styles.message}>Falha ao carregar os dados. Tente novamente mais tarde.</div>
      ) : (
        <div className={styles.workspace}>
          <form className={styles.formColumn} onSubmit={handleSubmit} noValidate>
            {formError && <div className={styles.formError}>{formError}</div>}

            <section className={styles.panel}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}><UserRound size={18} /></span>
                <div><span>CONTATO</span><h2>Quem é esta oportunidade?</h2></div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label htmlFor="name">Nome *</label>
                  <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nome do contato" />
                  {validationErrors.name && <span className={styles.fieldError}>{validationErrors.name}</span>}
                </div>
                <div className={styles.field}>
                  <label htmlFor="phone">WhatsApp/Telefone *</label>
                  <input id="phone" type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
                  {validationErrors.phone && <span className={styles.fieldError}>{validationErrors.phone}</span>}
                </div>
                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label htmlFor="email">E-mail</label>
                  <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contato@email.com" />
                </div>
              </div>
            </section>

            <section className={styles.panel}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}><BriefcaseBusiness size={18} /></span>
                <div><span>OPORTUNIDADE</span><h2>Contexto comercial</h2></div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label htmlFor="service">Serviço</label>
                  <select id="service" value={serviceId} onChange={e => setServiceId(e.target.value)}>
                    <option value="">Nenhum (opcional)</option>
                    {services.map(service => <option key={service.id} value={service.id}>{service.name}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label htmlFor="source">Origem *</label>
                  <select id="source" value={source} onChange={e => setSource(e.target.value)}>
                    <option value="">Selecione...</option>
                    {SOURCE_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                  </select>
                  {validationErrors.source && <span className={styles.fieldError}>{validationErrors.source}</span>}
                </div>
                <div className={styles.field}>
                  <label htmlFor="urgency">Urgência</label>
                  <select id="urgency" value={urgency} onChange={e => setUrgency(e.target.value)}>
                    {URGENCY_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label htmlFor="potentialValue">Valor potencial</label>
                  <input
                    id="potentialValue"
                    type="text"
                    inputMode="decimal"
                    value={potentialValue}
                    onChange={e => setPotentialValue(e.target.value)}
                    placeholder="Ex: 1500,00"
                  />
                  {validationErrors.potentialValue && <span className={styles.fieldError}>{validationErrors.potentialValue}</span>}
                </div>
                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label htmlFor="notes">Observações</label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Objeções, contexto, próximos passos ou informações importantes..."
                  />
                </div>
              </div>
            </section>

            <div className={styles.footerActions}>
              <button type="button" className={styles.cancelButton} onClick={() => router.push('/painel/leads')}>Cancelar</button>
              <button type="submit" className={styles.submitButton} disabled={saving}>
                <Save size={16} />
                {saving ? 'Salvando...' : 'Cadastrar lead'}
              </button>
            </div>
          </form>

          <aside className={styles.previewColumn}>
            <section className={styles.previewCard}>
              <div className={styles.previewGlow} />
              <div className={styles.previewHeader}>
                <div><span>PREVIEW</span><strong>Opportunity card</strong></div>
                <Sparkles size={17} />
              </div>

              <div className={styles.previewIdentity}>
                <div className={styles.previewAvatar}>{(name.trim()[0] || 'L').toUpperCase()}</div>
                <div><strong>{name.trim() || 'Novo lead'}</strong><span>{selectedService}</span></div>
              </div>

              <div className={styles.previewMetrics}>
                <div><small>Valor potencial</small><strong>{formatPreviewCurrency(potentialValue)}</strong></div>
                <div><small>Urgência</small><strong>{urgency}</strong></div>
              </div>

              <div className={styles.previewRows}>
                <div><Phone size={14} /><span>{phone || 'Telefone não informado'}</span></div>
                <div><Mail size={14} /><span>{email || 'E-mail não informado'}</span></div>
                <div><BriefcaseBusiness size={14} /><span>{source || 'Origem não definida'}</span></div>
                <div><CircleDollarSign size={14} /><span>Entrará na etapa Novo</span></div>
              </div>
            </section>

            <div className={styles.tipCard}>
              <span>LEADFLOW TIP</span>
              <strong>Quanto mais contexto, melhor o acompanhamento.</strong>
              <p>Use as observações para registrar detalhes que ajudem na próxima ação comercial.</p>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
