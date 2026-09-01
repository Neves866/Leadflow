'use client';

import styles from "./sucesso.module.css";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SucessoPage() {
  const router = useRouter();
  const [protocol, setProtocol] = useState<string>('');

  useEffect(() => {
    const savedProtocol = localStorage.getItem('leadflow_last_protocol') || '#LF-000000';
    setProtocol(savedProtocol);
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
          <button className={styles.btnPrimary} onClick={() => window.open('https://wa.me/5511999999999', '_blank')}>
            Continuar no WhatsApp
          </button>
          <button className={styles.btnSecondary} onClick={() => router.push('/')}>
            Voltar para o Início
          </button>
        </div>
      </div>
    </div>
  );
}
