'use client';

import { useEffect, useState } from 'react';
import styles from './sucesso.module.css';

export default function SucessoPage() {
  const [protocol, setProtocol] = useState('');
  const [orgName, setOrgName] = useState('Nossa equipe');
  const [whatsapp, setWhatsapp] = useState('');
  const [returnUrl, setReturnUrl] = useState('');
  const [returnLabel, setReturnLabel] = useState('Voltar ao site');

  useEffect(() => {
    setProtocol(localStorage.getItem('leadflow_last_protocol') || '');
    setOrgName(localStorage.getItem('leadflow_last_org_name') || 'Nossa equipe');
    setWhatsapp(localStorage.getItem('leadflow_last_support_whatsapp') || '');
    setReturnUrl(localStorage.getItem('leadflow_last_return_url') || '');
    setReturnLabel(localStorage.getItem('leadflow_last_return_label') || 'Voltar ao site');
    localStorage.removeItem('leadflow_last_lead_id');
  }, []);

  const handleWhatsApp = () => {
    if (!whatsapp) return;

    const protocolText = protocol ? ` Meu protocolo é ${protocol}.` : '';
    const message = encodeURIComponent(`Olá! Acabei de solicitar um atendimento pelo formulário.${protocolText}`);
    window.open(`https://wa.me/${whatsapp}?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <main className={styles.page}>
      <section className={styles.container}>
        <div className={styles.successMark} aria-hidden="true">✓</div>
        <span className={styles.eyebrow}>Solicitação enviada</span>
        <h1 className={styles.title}>Pronto! Recebemos seu pedido.</h1>
        <p className={styles.subtitle}>
          {orgName} já recebeu as informações. Agora é só aguardar o retorno pelo WhatsApp.
        </p>

        {protocol && (
          <div className={styles.protocol}>
            <span className={styles.label}>Protocolo do atendimento</span>
            <strong className={styles.value}>{protocol}</strong>
          </div>
        )}

        <div className={styles.nextSteps}>
          <div className={styles.nextStepItem}>
            <span>1</span>
            <p>Seu pedido foi registrado com sucesso.</p>
          </div>
          <div className={styles.nextStepItem}>
            <span>2</span>
            <p>A equipe analisa as informações que você enviou.</p>
          </div>
          <div className={styles.nextStepItem}>
            <span>3</span>
            <p>Você recebe o retorno para combinar o atendimento.</p>
          </div>
        </div>

        <div className={styles.actions}>
          {whatsapp && (
            <button type="button" className={styles.btnPrimary} onClick={handleWhatsApp}>
              Falar pelo WhatsApp
            </button>
          )}

          {returnUrl && (
            <a className={styles.btnSecondary} href={returnUrl}>
              {returnLabel}
            </a>
          )}
        </div>

        <p className={styles.footerNote}>Você não precisa preencher o formulário novamente.</p>
      </section>
    </main>
  );
}
