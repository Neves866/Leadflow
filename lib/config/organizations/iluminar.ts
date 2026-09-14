import { OrganizationConfig } from '@/lib/types/config';

export const iluminarConfig: OrganizationConfig = {
  id: 'org_iluminar_001',
  slug: 'iluminar',
  name: 'Iluminar',
  branding: {
    primaryColor: '#007bff',
    secondaryColor: '#6c757d',
  },
  services: [
    { id: 'ar', label: 'Ar-condicionado', icon: '❄️', servicoTemplate: '{serviceType} ({btus} BTUs)' },
    { id: 'eletr', label: 'Instalações Elétricas', icon: '⚡' },
    { id: 'seg', label: 'Segurança Eletrônica', icon: '🛡️' },
    { id: 'auto', label: 'Automação Residencial', icon: '🏠' },
  ],
  forms: [
    {
      id: 'form_iluminar_orcamento',
      slug: 'iluminar-orcamento',
      steps: [
        {
          id: 'details',
          title: 'Detalhes do Serviço',
          subtitle: 'Conte-nos mais sobre sua necessidade.',
          fields: [
            {
              id: 'serviceType',
              type: 'select',
              label: 'Tipo de Serviço',
              options: [
                { label: 'Instalação', value: 'Instalação' },
                { label: 'Manutenção', value: 'Manutenção' },
                { label: 'Higienização', value: 'Higienização' },
              ],
              order: 1,
              showWhen: { field: 'serviceId', equals: 'ar' },
            },
            {
              id: 'btus',
              type: 'text',
              label: 'Capacidade (BTUs)',
              placeholder: 'Ex: 9000, 12000',
              order: 2,
              showWhen: { field: 'serviceId', equals: 'ar' },
            },
            {
              id: 'hasEquipment',
              type: 'select',
              label: 'Já possui equipamento?',
              options: [
                { label: 'Sim', value: 'Sim' },
                { label: 'Não', value: 'Não' },
              ],
              order: 3,
              showWhen: { field: 'serviceId', equals: 'ar' },
            },
            {
              id: 'backToBack',
              type: 'select',
              label: 'Instalação costas a costas?',
              options: [
                { label: 'Sim', value: 'Sim' },
                { label: 'Não', value: 'Não' },
              ],
              order: 4,
              showWhen: { field: 'serviceId', equals: 'ar' },
            },
            {
              id: 'city',
              type: 'text',
              label: 'Cidade',
              order: 5,
            },
            {
              id: 'neighborhood',
              type: 'text',
              label: 'Bairro',
              order: 6,
            },
            {
              id: 'urgency',
              type: 'select',
              label: 'Urgência',
              options: [
                { label: 'Baixa', value: 'Baixa' },
                { label: 'Média', value: 'Média' },
                { label: 'Alta', value: 'Alta' },
              ],
              order: 7,
            },
            {
              id: 'notes',
              type: 'textarea',
              label: 'Observações',
              order: 8,
            },
          ],
        },
        {
          id: 'contact',
          title: 'Contato',
          subtitle: 'Quase lá! Como podemos entrar em contato com você?',
          fields: [
            {
              id: 'name',
              type: 'text',
              label: 'Nome Completo',
              required: true,
              order: 1,
            },
            {
              id: 'whatsapp',
              type: 'tel',
              label: 'WhatsApp',
              placeholder: '(00) 00000-0000',
              required: true,
              order: 2,
            },
          ],
        },
      ],
    },
  ],
};
