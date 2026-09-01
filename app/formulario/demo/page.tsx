'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './form.module.css';

type Step = 'category' | 'details' | 'contact';

export default function DemoForm() {
  const router = useRouter();
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

  const categories = [
    { id: 'ar', label: 'Ar-condicionado', icon: '❄️' },
    { id: 'eletr', label: 'Instalações Elétricas', icon: '⚡' },
    { id: 'seg', label: 'Segurança Eletrônica', icon: '🛡️' },
    { id: 'auto', label: 'Automação Residencial', icon: '🏠' },
  ];

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

    // Simple localStorage simulation
    const existingLeads = JSON.parse(localStorage.getItem('leadflow_leads') || '[]');
    const newLead = {
      id: Date.now().toString(),
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
    };

    localStorage.setItem('leadflow_leads', JSON.stringify([...existingLeads, newLead]));
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
              {categories.map(cat => (
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

        {step === 'details' && (
          <div className={styles.stepContent}>
            <h1 className={styles.title}>Detalhes do Serviço</h1>
            <p className={styles.subtitle}>Conte-nos mais sobre sua necessidade de {formData.category}.</p>

            <form className={styles.formGrid}>
              {formData.category === 'Ar-condicionado' ? (
                <>
                  <div className={styles.field}>
                    <label>Tipo de Serviço</label>
                    <select
                      value={formData.serviceType}
                      onChange={e => setFormData({...formData, serviceType: e.target.value})}
                    >
                      <option value="">Selecione...</option>
                      <option value="Instalação">Instalação</option>
                      <option value="Manutenção">Manutenção</option>
                      <option value="Higienização">Higienização</option>
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label>Capacidade (BTUs)</label>
                    <input
                      type="text"
                      placeholder="Ex: 9000, 12000"
                      value={formData.btus}
                      onChange={e => setFormData({...formData, btus: e.target.value})}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Já possui equipamento?</label>
                    <select
                      value={formData.hasEquipment}
                      onChange={e => setFormData({...formData, hasEquipment: e.target.value})}
                    >
                      <option value="">Selecione...</option>
                      <option value="Sim">Sim</option>
                      <option value="Não">Não</option>
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label>Instalação costas a costas?</label>
                    <select
                      value={formData.backToBack}
                      onChange={e => setFormData({...formData, backToBack: e.target.value})}
                    >
                      <option value="">Selecione...</option>
                      <option value="Sim">Sim</option>
                      <option value="Não">Não</option>
                    </select>
                  </div>
                </>
              ) : (
                <div className={styles.field}>
                  <label>Descreva brevemente o serviço</label>
                  <textarea
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    placeholder="Como podemos te ajudar?"
                  />
                </div>
              )}

              <div className={styles.field}>
                <label>Cidade</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={e => setFormData({...formData, city: e.target.value})}
                />
              </div>
              <div className={styles.field}>
                <label>Bairro</label>
                <input
                  type="text"
                  value={formData.neighborhood}
                  onChange={e => setFormData({...formData, neighborhood: e.target.value})}
                />
              </div>
              <div className={styles.field}>
                <label>Urgência</label>
                <select
                  value={formData.urgency}
                  onChange={e => setFormData({...formData, urgency: e.target.value})}
                >
                  <option value="Baixa">Baixa</option>
                  <option value="Média">Média</option>
                  <option value="Alta">Alta</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>Observações</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                />
              </div>

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
              <div className={styles.field}>
                <label>Nome Completo</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className={styles.field}>
                <label>WhatsApp</label>
                <input
                  type="tel"
                  required
                  placeholder="(00) 00000-0000"
                  value={formData.whatsapp}
                  onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                />
              </div>

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
