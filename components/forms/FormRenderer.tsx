'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormConfig, FormFieldConfig, OrganizationConfig } from '@/lib/types/config';
import styles from './FormRenderer.module.css';

interface FormRendererProps {
  orgConfig: OrganizationConfig;
  formConfig: FormConfig;
}

type Step = 'category' | 'details' | 'contact';

const STEP_NUMBER: Record<Step, number> = {
  category: 1,
  details: 2,
  contact: 3,
};

export default function FormRenderer({ orgConfig, formConfig }: FormRendererProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('category');
  const [formData, setFormData] = useState<Record<string, string>>({ urgency: 'Média' });
  const [detailError, setDetailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detailsStep = formConfig.steps.find(item => item.id === 'details');
  const contactStep = formConfig.steps.find(item => item.id === 'contact');
  const selectedService = orgConfig.services.find(service => service.id === formData.serviceId);

  const isVisible = (field: FormFieldConfig) => {
    if (!field.showWhen) return true;
    return formData[field.showWhen.field] === field.showWhen.equals;
  };

  const visibleDetailFields = detailsStep?.fields.filter(isVisible) ?? [];

  const updateField = (fieldId: string, value: string) => {
    setDetailError(null);
    setFormData(current => {
      const next = { ...current, [fieldId]: value };

      if (fieldId === 'problem' && value !== 'Quero instalar') {
        delete next.hasEquipment;
        delete next.btus;
      }

      return next;
    });
  };

  const handleCategorySelect = (serviceId: string, serviceLabel: string) => {
    setFormData({
      urgency: 'Média',
      serviceId,
      category: serviceLabel,
    });
    setDetailError(null);
    setStep('details');
  };

  const handleDetailsContinue = (event: React.FormEvent) => {
    event.preventDefault();

    const missingRequired = visibleDetailFields.some(
      field => field.required && !formData[field.id]?.trim()
    );

    if (missingRequired) {
      setDetailError('Responda os campos principais para continuarmos.');
      return;
    }

    setDetailError(null);
    setStep('contact');
  };

  const prevStep = () => {
    setError(null);
    if (step === 'contact') setStep('details');
    else if (step === 'details') setStep('category');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/forms/${formConfig.slug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: formData.serviceId,
          answers: formData,
        }),
      });

      const result = (await response.json()) as {
        success?: boolean;
        protocol?: string;
        leadId?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao enviar a solicitação');
      }

      localStorage.setItem('leadflow_last_protocol', result.protocol || '');
      localStorage.setItem('leadflow_last_lead_id', result.leadId || '');
      router.push('/sucesso');
    } catch (err: any) {
      setError(err.message || 'Não foi possível enviar agora. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field: FormFieldConfig) => {
    if (!isVisible(field)) return null;

    const value = formData[field.id] || '';

    if (field.type === 'select') {
      return (
        <div key={`${field.id}-${field.showWhen?.equals ?? 'common'}`} className={styles.field}>
          <label className={styles.fieldLabel}>
            {field.label}
            {field.required && <span className={styles.requiredMark}>*</span>}
          </label>
          <div className={styles.choiceGrid}>
            {field.options?.map(option => {
              const selected = value === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`${styles.choiceButton} ${selected ? styles.choiceButtonSelected : ''}`}
                  onClick={() => updateField(field.id, option.value)}
                  aria-pressed={selected}
                >
                  <span>{option.label}</span>
                  <span className={styles.choiceIndicator}>{selected ? '✓' : '›'}</span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (field.type === 'textarea') {
      return (
        <div key={field.id} className={styles.field}>
          <label className={styles.fieldLabel} htmlFor={field.id}>
            {field.label}
            {field.required && <span className={styles.requiredMark}>*</span>}
          </label>
          <textarea
            id={field.id}
            value={value}
            required={field.required}
            onChange={event => updateField(field.id, event.target.value)}
            placeholder={field.placeholder}
          />
          {field.id === 'notes' && (
            <span className={styles.fieldHint}>Se precisar, você também poderá enviar fotos pelo WhatsApp depois.</span>
          )}
        </div>
      );
    }

    return (
      <div key={field.id} className={styles.field}>
        <label className={styles.fieldLabel} htmlFor={field.id}>
          {field.label}
          {field.required && <span className={styles.requiredMark}>*</span>}
        </label>
        <input
          id={field.id}
          type={field.type}
          value={value}
          required={field.required}
          onChange={event => updateField(field.id, event.target.value)}
          placeholder={field.placeholder}
          autoComplete={field.id === 'name' ? 'name' : field.id === 'whatsapp' ? 'tel' : undefined}
        />
      </div>
    );
  };

  const currentStep = STEP_NUMBER[step];

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.brandBar}>
          <div className={styles.brandIdentity}>
            <div className={styles.brandMark}>I</div>
            <div>
              <strong>{orgConfig.name}</strong>
              <span>Pedido de atendimento</span>
            </div>
          </div>
          <span className={styles.quickBadge}>Leva menos de 1 minuto</span>
        </div>

        <div className={styles.formContainer}>
          <div className={styles.progressHeader}>
            <span>Etapa {currentStep} de 3</span>
            <span>{currentStep === 1 ? 'Serviço' : currentStep === 2 ? 'Detalhes' : 'Contato'}</span>
          </div>
          <div className={styles.progressTrack} aria-hidden="true">
            <div className={styles.progressFill} style={{ width: `${(currentStep / 3) * 100}%` }} />
          </div>

          {step === 'category' && (
            <div className={styles.stepContent}>
              <span className={styles.eyebrow}>Vamos resolver isso</span>
              <h1 className={styles.title}>Como podemos ajudar?</h1>
              <p className={styles.subtitle}>
                Escolha o que melhor representa o que você precisa. É rápido e sem compromisso.
              </p>

              <div className={styles.categoryGrid}>
                {orgConfig.services.map(service => (
                  <button
                    key={service.id}
                    type="button"
                    className={styles.categoryCard}
                    onClick={() => handleCategorySelect(service.id, service.label)}
                  >
                    <span className={styles.categoryIcon}>{service.icon}</span>
                    <span className={styles.categoryCopy}>
                      <strong>{service.label}</strong>
                      <small>Quero atendimento</small>
                    </span>
                    <span className={styles.categoryArrow}>›</span>
                  </button>
                ))}
              </div>

              <div className={styles.reassurance}>Sem orçamento automático. A Iluminar analisa seu pedido e fala com você.</div>
            </div>
          )}

          {step === 'details' && (
            <div className={styles.stepContent}>
              <button type="button" className={styles.inlineBack} onClick={prevStep}>← Trocar serviço</button>
              <div className={styles.selectedService}>
                <span>{selectedService?.icon}</span>
                <div>
                  <small>Serviço escolhido</small>
                  <strong>{selectedService?.label}</strong>
                </div>
              </div>

              <h1 className={styles.title}>{detailsStep?.title}</h1>
              <p className={styles.subtitle}>{detailsStep?.subtitle}</p>

              <form className={styles.formGrid} onSubmit={handleDetailsContinue} noValidate>
                {detailsStep?.fields.map(renderField)}

                {detailError && <div className={styles.errorMessage}>{detailError}</div>}

                <div className={styles.navButtons}>
                  <button type="button" className={styles.btnSecondary} onClick={prevStep}>Voltar</button>
                  <button type="submit" className={styles.btnPrimary}>Continuar</button>
                </div>
              </form>
            </div>
          )}

          {step === 'contact' && (
            <div className={styles.stepContent}>
              <button type="button" className={styles.inlineBack} onClick={prevStep}>← Voltar aos detalhes</button>
              <span className={styles.eyebrow}>Última etapa</span>
              <h1 className={styles.title}>{contactStep?.title}</h1>
              <p className={styles.subtitle}>{contactStep?.subtitle}</p>

              <form className={styles.formGrid} onSubmit={handleSubmit}>
                {contactStep?.fields.map(renderField)}

                {error && <div className={styles.errorMessage}>{error}</div>}

                <div className={styles.summaryStrip}>
                  <div>
                    <span>Seu pedido</span>
                    <strong>{formData.problem || selectedService?.label}</strong>
                  </div>
                  <div>
                    <span>Atendimento</span>
                    <strong>{formData.urgency === 'Alta' ? 'O quanto antes' : formData.urgency === 'Baixa' ? 'Consulta' : 'Próximos dias'}</strong>
                  </div>
                </div>

                <div className={styles.navButtons}>
                  <button type="button" className={styles.btnSecondary} onClick={prevStep}>Voltar</button>
                  <button type="submit" disabled={loading} className={styles.btnPrimary}>
                    {loading ? 'Enviando...' : 'Solicitar atendimento'}
                  </button>
                </div>

                <p className={styles.privacyNote}>Seus dados serão usados somente para a Iluminar retornar este atendimento.</p>
              </form>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
