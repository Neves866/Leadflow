'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OrganizationConfig, FormConfig } from '@/lib/types/config';
import styles from './FormRenderer.module.css';

interface FormRendererProps {
  orgConfig: OrganizationConfig;
  formConfig: FormConfig;
}

export default function FormRenderer({ orgConfig, formConfig }: FormRendererProps) {
  const router = useRouter();
  const [step, setStep] = useState<'category' | 'details' | 'contact'>('category');
  const [formData, setFormData] = useState<Record<string, string>>({
    urgency: 'Média',
  });

  const handleCategorySelect = (service: any) => {
    setFormData({ ...formData, serviceId: service.id, category: service.label });
    setStep('details');
  };

  const nextStep = () => setStep('contact');
  const prevStep = () => {
    if (step === 'contact') setStep('details');
    else if (step === 'details') setStep('category');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const protocol = `LF-${Math.floor(100000 + Math.random() * 900000)}`;
    const existingLeads = JSON.parse(localStorage.getItem('leadflow_leads') || '[]');
    const leadId = Date.now().toString();

    // Determine the visual service name for dashboard compatibility
    const selectedService = orgConfig.services.find(s => s.id === formData.serviceId);
    const serviceLabel = selectedService?.label || formData.category || 'Não informado';

    // Generic composition: the org config may define a template with
    // {fieldId} placeholders resolved from the form answers.
    const resolveServicoTemplate = (template: string): string =>
      template.replace(/\{(\w+)\}/g, (_match, fieldId: string) => formData[fieldId] || '');

    const servicoDesc = selectedService?.servicoTemplate
      ? resolveServicoTemplate(selectedService.servicoTemplate)
      : serviceLabel;

    const newLead = {
      id: leadId,
      nome: formData.name,
      telefone: formData.whatsapp,
      email: '',
      servico: servicoDesc,
      origem: `Formulário ${formConfig.slug}`,
      status: 'Novo',
      urgencia: formData.urgency || 'Média',
      valorPotencial: 0,
      data: new Date().toISOString().split('T')[0],
      observacoes: formData.notes,
      protocol: protocol,
      organizationId: orgConfig.id,
      formId: formConfig.id,
      formSlug: formConfig.slug,
      respostas: {
        ...formData,
        categoria: serviceLabel,
      }
    };

    localStorage.setItem('leadflow_leads', JSON.stringify([...existingLeads, newLead]));
    localStorage.setItem('leadflow_last_protocol', protocol);
    localStorage.setItem('leadflow_last_lead_id', leadId);
    router.push('/sucesso');
  };

  return (
    <div className={styles.page}>
      <div className={styles.formContainer}>
        <div className={styles.progress}>
          <div className={`${styles.step} ${step === 'category' ? styles.active : ''}`}>1</div>
          <div className={`${styles.step} ${step === 'details' || step === 'contact' ? styles.active : ''}`}>2</div>
          <div className={`${styles.step} ${step === 'contact' ? styles.active : ''}`}>3</div>
        </div>

        {step === 'category' && (
          <div className={styles.stepContent}>
            <h1 className={styles.title}>O que você precisa?</h1>
            <p className={styles.subtitle}>Selecione a categoria do serviço para começarmos.</p>
            <div className={styles.categoryGrid}>
              {orgConfig.services.map(service => (
                <button
                  key={service.id}
                  className={styles.categoryCard}
                  onClick={() => handleCategorySelect(service)}
                >
                  <span className={styles.categoryIcon}>{service.icon}</span>
                  <span className={styles.categoryLabel}>{service.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'details' && (
          <div className={styles.stepContent}>
            <h1 className={styles.title}>Detalhes do Serviço</h1>
            <p className={styles.subtitle}>Conte-nos mais sobre sua necessidade de {formData.category}.</p>

            <form className={styles.formGrid}>
              {formConfig.steps.find(s => s.id === 'details')?.fields.map(field => {
                if (field.showWhen && formData[field.showWhen.field] !== field.showWhen.equals) {
                  return null;
                }

                const value = formData[field.id] || '';

                if (field.type === 'select') {
                  return (
                    <div key={field.id} className={styles.field}>
                      <label>{field.label}</label>
                      <select
                        value={value}
                        onChange={e => setFormData({...formData, [field.id]: e.target.value})}
                      >
                        <option value="">Selecione...</option>
                        {field.options?.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  );
                }

                if (field.type === 'textarea') {
                  return (
                    <div key={field.id} className={styles.field}>
                      <label>{field.label}</label>
                      <textarea
                        value={value}
                        onChange={e => setFormData({...formData, [field.id]: e.target.value})}
                        placeholder={field.placeholder}
                      />
                    </div>
                  );
                }

                return (
                  <div key={field.id} className={styles.field}>
                    <label>{field.label}</label>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={value}
                      onChange={e => setFormData({...formData, [field.id]: e.target.value})}
                    />
                  </div>
                );
              })}

              <div className={styles.navButtons}>
                <button type="button" className={styles.btnSecondary} onClick={prevStep}>Voltar</button>
                <button type="button" className={styles.btnPrimary} onClick={nextStep}>Próximo</button>
              </div>
            </form>
          </div>
        )}

        {step === 'contact' && (
          <div className={styles.stepContent}>
            <h1 className={styles.title}>Contato</h1>
            <p className={styles.subtitle}>Quase lá! Como podemos entrar em contato com você?</p>

            <form className={styles.formGrid} onSubmit={handleSubmit}>
              {formConfig.steps.find(s => s.id === 'contact')?.fields.map(field => (
                <div key={field.id} className={styles.field}>
                  <label>{field.label}</label>
                  <input
                    type={field.type}
                    required={field.required}
                    placeholder={field.placeholder}
                    value={formData[field.id] || ''}
                    onChange={e => setFormData({...formData, [field.id]: e.target.value})}
                  />
                </div>
              ))}

              <div className={styles.navButtons}>
                <button type="button" className={styles.btnSecondary} onClick={prevStep}>Voltar</button>
                <button type="submit" className={styles.btnPrimary}>Enviar Solicitação</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
