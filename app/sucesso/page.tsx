'use client';

import styles from "./sucesso.module.css";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SucessoPage() {
  const router = useRouter();
  const [protocol, setProtocol] = useState<string>('');
  const [lastLeadId, setLastLeadId] = useState<string | null>(null);

  useEffect(() => {
    const savedProtocol = localStorage.getItem('leadflow_last_protocol') || '#LF-000000';
    const leadId = localStorage.getItem('leadflow_last_lead_id');
    setProtocol(savedProtocol);
    setLastLeadId(leadId);
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.icon}>✅</div>
        <h1 className={styles.title}>Solicitação Recebida!</h1>
        <p className={styles.subtitle}>
          Recebemos seus dados com sucesso. Um de nossos especialistas entrará em contato em breve.
        </p>

        <div className={styles.protocol}>
          <span className={styles.label}>Protocolo:</span>
          <span className={styles.value}>{protocol}</span>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.btnPrimary}
            onClick={() => router.push(lastLeadId ? `/painel/leads/${lastLeadId}` : '/painel/leads')}
          >
            Ver lead no painel
          </button>
          <button className={styles.btnSecondary} onClick={() => router.push('/')}>
            Voltar ao Início
          </button>
        </div>
      </div>
    </div>
  );
}
