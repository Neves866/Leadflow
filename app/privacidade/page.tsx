import styles from './privacidade.module.css';

export const metadata = {
  title: 'Política de Privacidade | LeadFlow',
  description: 'Saiba como o LeadFlow processa e protege os dados de leads e usuários da plataforma.',
};

export default function PrivacidadePage() {
  return (
    <div className={styles.container}>
      <main className={styles.content}>
        <header className={styles.header}>
          <h1>Política de Privacidade</h1>
          <p className={styles.lastUpdate}>Última atualização: 25 de setembro de 2026</p>
        </header>

        <section>
          <h2>1. Visão Geral</h2>
          <p>
            O <strong>LeadFlow</strong> é uma plataforma de CRM projetada para a captação e gestão inteligente de leads.
            Nossa plataforma recebe, organiza e processa informações de leads provenientes de formulários próprios, sites e
            integrações autorizadas com serviços de terceiros, com o objetivo de otimizar a conversão de interesse em oportunidades de negócio.
          </p>
        </section>

        <section>
          <h2>2. Informações Coletadas</h2>

          <h3>2.1 Dados de Leads e Contatos</h3>
          <p>
            Processamos dados enviados por empresas clientes através de formulários e integrações. Estes dados geralmente incluem:
          </p>
          <ul>
            <li>Nome completo;</li>
            <li>Informações de contato (e-mail, telefone);</li>
            <li>Interesses específicos ou solicitações feitas via formulário;</li>
            <li>Dados de origem da campanha ou site onde o lead foi capturado.</li>
          </ul>

          <h3>2.2 Dados de Usuários da Plataforma</h3>
          <p>
            Para a operação da conta do CRM, coletamos informações necessárias para a autenticação e gestão do usuário,
            como nome, e-mail de login e preferências de configuração da conta.
          </p>

          <h3>2.3 Dados Técnicos e de Utilização</h3>
          <p>
            Coletamos automaticamente dados técnicos para garantir a estabilidade e segurança do serviço, tais como:
            endereços IP, logs de acesso, tipo de navegador e dados de interação com a interface da plataforma.
          </p>
        </section>

        <section>
          <h2>3. Origem e Finalidade do Tratamento</h2>
          <p>
            Os dados são originados de:
          </p>
          <ul>
            <li>Entrada direta via formulários públicos do LeadFlow;</li>
            <li>Integrações autorizadas com sites de terceiros;</li>
            <li>Integrações com APIs de redes sociais e plataformas de anúncios (ex: Meta Lead Ads).</li>
          </ul>
          <p>
            A finalidade do tratamento é estritamente a de fornecer as ferramentas de CRM para que a empresa cliente possa
            gerir seus leads, organizar seu pipeline de vendas e realizar o contato com potenciais clientes.
          </p>
        </section>

        <section>
          <h2>4. Integrações com Terceiros e Meta/Facebook</h2>
          <p>
            O LeadFlow integra-se a serviços de terceiros para facilitar a automação de leads.
          </p>
          <div className={styles.alert}>
            <strong>Segurança de Credenciais:</strong>
            <ul>
              <li>O LeadFlow <strong>não solicita nem armazena senhas</strong> de contas Facebook/Meta dos clientes.</li>
              <li>A conexão com a Meta ocorre exclusivamente via autorização <strong>OAuth</strong>, fornecida diretamente pela própria Meta.</li>
              <li>Tokens e credenciais de integração são tratados como informações sensíveis e não são expostos publicamente ou ao navegador.</li>
            </ul>
          </div>
          <p>
            Utilizamos APIs autorizadas para a sincronização de leads, garantindo que o fluxo de dados ocorra dentro dos
            padrões técnicos e de segurança estabelecidos pelos provedores.
          </p>
        </section>

        <section>
          <h2>5. Armazenamento, Segurança e Compartilhamento</h2>
          <p>
            Os dados são armazenados em infraestrutura de nuvem profissional, utilizando provedores de hospedagem e banco de dados
            reconhecidos no mercado, essenciais para o funcionamento da plataforma.
          </p>
          <p>
            <strong>Compartilhamento:</strong> O LeadFlow não vende dados pessoais. As informações são processadas apenas
            para a finalidade de prestar o serviço de CRM ao cliente contratante.
          </p>
        </section>

        <section>
          <h2>6. Retenção e Exclusão</h2>
          <p>
            Os dados são retidos pelo período necessário para a prestação do serviço ou enquanto a conta do cliente estiver ativa.
            A exclusão de dados pode ser solicitada através dos canais de suporte oficiais.
          </p>
        </section>

        <section>
          <h2>7. Cookies e Tecnologias Semelhantes</h2>
          <p>
            Utilizamos cookies essenciais para a manutenção da sessão de login e para a funcionalidade básica de
            navegação do usuário na plataforma.
          </p>
        </section>

        <section>
          <h2>8. Direitos previstos na LGPD</h2>
          <p>
            Em conformidade com a Lei Geral de Proteção de Dados (LGPD), garantimos aos titulares dos dados o direito de:
          </p>
          <ul>
            <li>Confirmar a existência de tratamento de seus dados;</li>
            <li>Acessar seus dados pessoais;</li>
            <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
            <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade com a lei.</li>
          </ul>
          <p>
            <strong>Responsabilidade:</strong> Cada empresa usuária do LeadFlow é a controladora dos dados de seus próprios leads e
            é a única responsável por possuir a base legal adequada para a coleta e utilização desses dados.
          </p>
        </section>

        <section>
          <h2>9. Alterações na Política</h2>
          <p>
            Esta política pode ser atualizada periodicamente para refletir melhorias no serviço ou mudanças regulatórias.
            Recomendamos a consulta regular a esta página.
          </p>
        </section>

        <section>
          <h2>10. Canal de Contato</h2>
          <p>
            Para solicitações de acesso, correção ou exclusão de dados, bem como dúvidas sobre a nossa Política de Privacidade,
            por favor, utilize o <strong>canal oficial de suporte disponibilizado pelo LeadFlow</strong> dentro da plataforma.
          </p>
        </section>
      </main>
    </div>
  );
}
