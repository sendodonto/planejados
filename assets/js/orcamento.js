const form = document.getElementById('formulario');
const ambientesError = document.getElementById('ambientes-error');
const formStatus = document.getElementById('form-status');

form?.addEventListener('submit', (event) => {
  event.preventDefault();

  const data = new FormData(form);
  const ambientes = data.getAll('ambiente');
  const nome = String(data.get('nome') || '').trim();
  const local = String(data.get('local') || '').trim();
  const fase = String(data.get('fase') || '').trim();
  const detalhes = String(data.get('detalhes') || '').trim();
  const consentimento = data.get('consentimento');

  ambientesError.textContent = ambientes.length ? '' : 'Escolha pelo menos um ambiente.';
  formStatus.textContent = '';

  if (!ambientes.length || !nome || !local || !consentimento) {
    if (!nome || !local) form.reportValidity();
    if (!consentimento) formStatus.textContent = 'Confirme a autorização para continuar.';
    if (!ambientes.length) form.querySelector('input[name="ambiente"]')?.focus();
    return;
  }

  const linhas = [
    'Olá! Vim pelo site da P.A.P e gostaria de solicitar um orçamento.',
    '',
    `Nome: ${nome}`,
    `Cidade e bairro: ${local}`,
    `Ambiente${ambientes.length > 1 ? 's' : ''}: ${ambientes.join(', ')}`,
  ];

  if (fase) linhas.push(`Momento do ambiente: ${fase}`);
  if (detalhes) linhas.push(`Detalhes do projeto: ${detalhes}`);
  linhas.push('', 'Podemos conversar sobre o projeto?');

  const url = `https://wa.me/5513991765368?text=${encodeURIComponent(linhas.join('\n'))}`;
  window.location.href = url;
});
