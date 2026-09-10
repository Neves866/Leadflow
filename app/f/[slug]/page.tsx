import { getFormConfigBySlug } from '@/lib/config';
import FormRenderer from '@/components/forms/FormRenderer';

export default async function PublicFormPage({ params }: { params: { slug: string } }) {
  const config = getFormConfigBySlug(params.slug);

  if (!config) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'sans-serif',
        textAlign: 'center',
        flexDirection: 'column'
      }}>
        <h1>Formulário não encontrado</h1>
        <p>O link fornecido é inválido ou o formulário foi removido.</p>
      </div>
    );
  }

  return <FormRenderer orgConfig={config.organization} formConfig={config.form} />;
}
