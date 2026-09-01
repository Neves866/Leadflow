'use client';

import styles from "./details.module.css";
import { MOCK_LEADS, LeadStatus } from "@/lib/mocks";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function LeadDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [lead, setLead] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    const localLeads = JSON.parse(localStorage.getItem('leadflow_leads') || '[]');
    const overrides = JSON.parse(localStorage.getItem('leadflow_status_overrides') || '{}');
    const allLeads = [...localLeads, ...MOCK_LEADS];
    const found = allLeads.find(l => l.id === id);
    if (found) {
      setLead({ ...found, status: overrides[id] || found.status });
    }
  }, [id]);

  const handleStatusChange = (newStatus: string) => {
    if (!lead) return;

    const overrides = JSON.parse(localStorage.getItem('leadflow_status_overrides') || '{}');
    overrides[lead.id] = newStatus;
    localStorage.setItem('leadflow_status_overrides', JSON.stringify(overrides));

    setLead({ ...lead, status: newStatus });
  };

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
    const digits = lead.telefone.replace(/\D/g, '');
    let normalizedPhone = digits;
    if (digits.length === 10 || digits.length === 11) {
      normalizedPhone = `55${digits}`;
    }
    window.open(`https://wa.me/${normalizedPhone}?text=${message}`, '_blank');
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
          <select
            className={styles.statusButton}
            value={lead.status}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="Novo">Novo</option>
            <option value="Qualificado">Qualificado</option>
            <option value="Orçamento">Orçamento</option>
            <option value="Negociação">Negociação</option>
            <option value="Fechado">Fechado</option>
          </select>
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
            <p className={styles.value}>
              {lead.valorPotencial === 0
                ? 'A definir'
                : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.valorPotencial)}
            </p>
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
          {lead.respostas ? (
            <>
              <div className={styles.responseItem}>
                <p className={styles.label}>Categoria</p>
                <p className={styles.value}>{lead.respostas.categoria}</p>
              </div>
              {lead.respostas.tipoServico && (
                <div className={styles.responseItem}>
                  <p className={styles.label}>Tipo de Serviço</p>
                  <p className={styles.value}>{lead.respostas.tipoServico}</p>
                </div>
              )}
              {lead.respostas.btus && (
                <div className={styles.responseItem}>
                  <p className={styles.label}>Capacidade (BTUs)</p>
                  <p className={styles.value}>{lead.respostas.btus}</p>
                </div>
              )}
              {lead.respostas.possuiEquipamento && (
                <div className={styles.responseItem}>
                  <p className={styles.label}>Já possui equipamento?</p>
                  <p className={styles.value}>{lead.respostas.possuiEquipamento}</p>
                </div>
              )}
              {lead.respostas.costasACostas && (
                <div className={styles.responseItem}>
                  <p className={styles.label}>Instalação costas a costas?</p>
                  <p className={styles.value}>{lead.respostas.costasACostas}</p>
                </div>
              )}
              <div className={styles.responseItem}>
                <p className={styles.label}>Cidade</p>
                <p className={styles.value}>{lead.respostas.cidade || 'Não informado'}</p>
              </div>
              <div className={styles.responseItem}>
                <p className={styles.label}>Bairro</p>
                <p className={styles.value}>{lead.respostas.bairro || 'Não informado'}</p>
              </div>
              <div className={styles.responseItem}>
                <p className={styles.label}>Urgência</p>
                <p className={styles.value}>{lead.respostas.urgencia}</p>
              </div>
              <div className={styles.responseItem}>
                <p className={styles.label}>Observações</p>
                <p className={styles.value}>{lead.respostas.observacoes || 'Nenhuma'}</p>
              </div>
            </>
          ) : (
            <>
              <div className={styles.responseItem}>
                <p className={styles.label}>Necessidade Principal</p>
                <p className={styles.value}>{lead.servico}</p>
              </div>
              <div className={styles.responseItem}>
                <p className={styles.label}>Observações</p>
                <p className={styles.value}>{lead.observacoes}</p>
              </div>
            </>
          )}
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

