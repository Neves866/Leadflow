'use client';

import styles from "./novo.module.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

      // 1. Authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Usuário não autenticado');

      // 2. Organization from membership (never from the form)
      const { data: membershipData, error: membershipError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1);

      if (membershipError) throw membershipError;

      const organizationId = membershipData?.[0]?.organization_id;
      if (!organizationId) throw new Error('Organização não encontrada para o usuário');

      // 3. Default pipeline + initial stage
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

      // 4. Contact lookup/creation by normalized phone
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

      // 5. Lead creation
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

      // 6. Activity log
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

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Novo Lead</h1>
          <p className={styles.subtitle}>Cadastre uma nova oportunidade manualmente.</p>
        </div>
        <button type="button" className={styles.cancelButton} onClick={() => router.push('/painel/leads')}>
          Cancelar
        </button>
      </header>

      {loading ? (
        <div className={styles.message}>Carregando...</div>
      ) : loadError ? (
        <div className={styles.message}>Falha ao carregar os dados. Tente novamente mais tarde.</div>
      ) : (
        <form className={styles.card} onSubmit={handleSubmit} noValidate>
          {formError && <p className={styles.formError}>{formError}</p>}

          <h2 className={styles.sectionTitle}>Contato</h2>
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
            <div className={styles.field}>
              <label htmlFor="email">E-mail</label>
              <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contato@email.com" />
            </div>
          </div>

          <h2 className={styles.sectionTitle}>Oportunidade</h2>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label htmlFor="service">Serviço</label>
              <select id="service" value={serviceId} onChange={e => setServiceId(e.target.value)}>
                <option value="">Nenhum (opcional)</option>
                {services.map(service => (
                  <option key={service.id} value={service.id}>{service.name}</option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="source">Origem *</label>
              <select id="source" value={source} onChange={e => setSource(e.target.value)}>
                <option value="">Selecione...</option>
                {SOURCE_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {validationErrors.source && <span className={styles.fieldError}>{validationErrors.source}</span>}
            </div>
            <div className={styles.field}>
              <label htmlFor="urgency">Urgência</label>
              <select id="urgency" value={urgency} onChange={e => setUrgency(e.target.value)}>
                {URGENCY_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="potentialValue">Valor Potencial</label>
              <input
                id="potentialValue"
                type="text"
                inputMode="decimal"
                value={potentialValue}
                onChange={e => setPotentialValue(e.target.value)}
                placeholder="Ex: 1500,00 (opcional)"
              />
              {validationErrors.potentialValue && <span className={styles.fieldError}>{validationErrors.potentialValue}</span>}
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label htmlFor="notes">Observações</label>
              <textarea
                id="notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Detalhes adicionais sobre a oportunidade"
              />
            </div>
          </div>

          <div className={styles.footerActions}>
            <button type="submit" className={styles.button} disabled={saving}>
              {saving ? 'Salvando...' : 'Cadastrar Lead'}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}