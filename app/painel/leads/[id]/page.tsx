import styles from "./details.module.css";
import { MOCK_LEADS, LeadStatus } from "@/lib/mocks";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LeadDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [lead, setLead] = useState<any>(null);

  useEffect(() => {
    const localLeads = JSON.parse(localStorage.getItem('leadflow_leads') || '[]');
    const allLeads = [...localLeads, ...MOCK_LEADS];
    const found = allLeads.find(l => l.id === params.id);
    setLead(found);
  }, [params.id]);

  if (!lead) {
    return (
      <div className={styles.container}>
        <p>Lead não encontrado.</p>
        <button onClick={() => router.back()}>Voltar</button>
      </div>
    );
  }

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`Olá ${lead.nome}, vi seu interesse em ${lead.servico} no LeadFlow.`);
    window.open(`https://wa.me/${lead.telefone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => router.back()}>
          ← Voltar para Leads
        </button>
        <div className={styles.actions}>
          <button className={styles.whatsappButton} onClick={handleWhatsApp}>
            WhatsApp
          </button>
          <button className={styles.statusButton}>
            Alterar Status
          </button>
        </div>
      </header>

      <div className={styles.grid}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Cliente</h2>
          <div className={styles.infoGroup}>
            <p className={styles.label}>Nome</p>
            <p className={styles.value}>{lead.nome}</p>
          </div>
          <div className={styles.infoGroup}>
            <p className={styles.label}>Telefone</p>
            <p className={styles.value}>{lead.telefone}</p>
          </div>
          <div className={styles.infoGroup}>
            <p className={styles.label}>Email</p>
            <p className={styles.value}>{lead.email || 'Não informado'}</p>
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Oportunidade</h2>
          <div className={styles.infoGroup}>
            <p className={styles.label}>Serviço</p>
            <p className={styles.value}>{lead.servico}</p>
          </div>
          <div className={styles.infoGroup}>
            <p className={styles.label}>Origem</p>
            <p className={styles.value}>{lead.origem}</p>
          </div>
          <div className={styles.infoGroup}>
            <p className={styles.label}>Urgência</p>
            <p className={styles.value}>{lead.urgencia}</p>
          </div>
          <div className={styles.infoGroup}>
            <p className={styles.label}>Data</p>
            <p className={styles.value}>{lead.data}</p>
          </div>
          <div className={styles.infoGroup}>
            <p className={styles.label}>Valor Potencial</p>
            <p className={styles.value}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.valorPotencial)}</p>
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Status Atual</h2>
          <div className={styles.statusWrapper}>
            <span className={styles.statusBadge}>{lead.status}</span>
          </div>
        </section>
      </div>

      <section className={`${styles.card} ${styles.fullWidth}`}>
        <h2 className={styles.cardTitle}>Respostas do Formulário</h2>
        <div className={styles.responses}>
          <div className={styles.responseItem}>
            <p className={styles.label}>Qual a sua necessidade principal?</p>
            <p className={styles.value}>{lead.servico}</p>
          </div>
          <div className={styles.responseItem}>
            <p className={styles.label}>Observações adicionais</p>
            <p className={styles.value}>{lead.observacoes}</p>
          </div>
        </div>
      </section>

      <section className={`${styles.card} ${styles.fullWidth}`}>
        <h2 className={styles.cardTitle}>Observações Internas</h2>
        <textarea
          className={styles.notesArea}
          defaultValue={lead.observacoes}
          placeholder="Adicione notas sobre este lead..."
        />
      </section>

      <section className={`${styles.card} ${styles.fullWidth}`}>
        <h2 className={styles.cardTitle}>Histórico de Atividades</h2>
        <div className={styles.timeline}>
          <div className={styles.timelineItem}>
            <div className={styles.dot} />
            <div className={styles.timelineContent}>
              <p className={styles.time}>{lead.data} - 14:20</p>
              <p>Lead criado via formulário público.</p>
            </div>
          </div>
          <div className={styles.timelineItem}>
            <div className={styles.dot} />
            <div className={styles.timelineContent}>
              <p className={styles.time}>31 Ago, 2026 - 09:00</p>
              <p>Status alterado para {lead.status}.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

