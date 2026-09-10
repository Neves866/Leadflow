'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './form.module.css';
import { getCurrentOrganizationConfig, getFormConfig } from '@/lib/config';

type Step = 'category' | 'details' | 'contact';

export default function DemoForm() {
  const router = useRouter();
  const orgConfig = getCurrentOrganizationConfig();
  const formConfig = getFormConfig(orgConfig.slug, 'demo');

  const [step, setStep] = useState<Step>('category');
  const [formData, setFormData] = useState({
    category: '',
    serviceType: '',
    btus: '',
    hasEquipment: '',
    backToBack: '',
    city: '',
    neighborhood: '',
    urgency: 'Média',
    notes: '',
    name: '',
    whatsapp: '',
  });

  const handleCategorySelect = (catId: string, label: string) => {
    setFormData({ ...formData, category: label });
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
    const newLead = {
      id: leadId,
      nome: formData.name,
      telefone: formData.whatsapp,
      email: '',
      servico: formData.category === 'Ar-condicionado' ? `${formData.serviceType} (${formData.btus} BTUs)` : formData.category,
      origem: 'Formulário Demo',
      status: 'Novo',
      urgencia: formData.urgency as any,
      valorPotencial: 0,
      data: new Date().toISOString().split('T')[0],
      observacoes: formData.notes,
      protocol: protocol,
      respostas: {
        categoria: formData.category,
        tipoServico: formData.serviceType,
        btus: formData.btus,
        possuiEquipamento: formData.hasEquipment,
        costasACostas: formData.backToBack,
        cidade: formData.city,
        bairro: formData.neighborhood,
        urgencia: formData.urgency,
        observacoes: formData.notes,
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
              {orgConfig.services.map(cat => (
                <button
                  key={cat.id}
                  className={styles.categoryCard}
                  onClick={() => handleCategorySelect(cat.id, cat.label)}
                >
                  <span className={styles.categoryIcon}>{cat.icon}</span>
                  <span className={styles.categoryLabel}>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'details' && formConfig && (
          <div className={styles.stepContent}>
            <h1 className={styles.title}>Detalhes do Serviço</h1>
            <p className={styles.subtitle}>Conte-nos mais sobre sua necessidade de {formData.category}.</p>

            <form className={styles.formGrid}>
              {formConfig.steps.find(s => s.id === 'details')?.fields.map(field => {
                if (field.showWhen && (formData as any)[field.showWhen.field] !== field.showWhen.equals) {
                  return null;
                }

                const value = (formData as any)[field.id];

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

        {step === 'contact' && formConfig && (
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
                    value={(formData as any)[field.id]}
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
