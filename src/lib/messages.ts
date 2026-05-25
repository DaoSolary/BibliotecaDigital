/** Traduz mensagens comuns do Supabase/Auth para português */
export function traduzirErro(mensagem: string): string {
  const mapa: Record<string, string> = {
    "Invalid login credentials": "E-mail ou senha incorretos.",
    "Email not confirmed": "Confirme seu e-mail antes de entrar.",
    "User already registered": "Este e-mail já está cadastrado.",
    "Password should be at least 6 characters": "A senha deve ter pelo menos 6 caracteres.",
    "Unable to validate email address: invalid format": "Formato de e-mail inválido.",
    "Signup requires a valid password": "Informe uma senha válida.",
    "Email rate limit exceeded": "Muitas tentativas. Aguarde alguns minutos.",
    "For security purposes, you can only request this once every 60 seconds":
      "Por segurança, aguarde 60 segundos antes de tentar novamente.",
    "New password should be different from the old password.":
      "A nova senha deve ser diferente da anterior.",
    "Auth session missing!": "Sessão expirada. Faça login novamente.",
    "JWT expired": "Sessão expirada. Faça login novamente.",
    "fetch failed": "Falha de conexão com o servidor. Verifique sua internet.",
    "Failed to fetch": "Não foi possível contactar o servidor. Tente de novo.",
    "duplicate key value violates unique constraint": "Este registo já existe.",
    "new row violates row-level security policy": "Sem permissão para esta operação.",
    "Row level security": "Sem permissão para esta operação.",
    "Network request failed": "Falha de rede. Verifique sua ligação.",
    "Request timeout": "O pedido expirou. Tente novamente.",
    "Database error saving new user": "Erro ao criar conta. Tente outro e-mail ou contacte o suporte.",
    "Invalid Refresh Token": "Sessão inválida. Faça login novamente.",
    "Refresh Token Not Found": "Sessão expirada. Faça login novamente.",
    "User not found": "Utilizador não encontrado.",
    "Email link is invalid or has expired": "O link expirou. Peça um novo e-mail de recuperação.",
    "over_request_rate_limit": "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
    "Request rate limit reached": "Limite de pedidos atingido. Aguarde alguns minutos.",
  };

  const exato = mapa[mensagem];
  if (exato) return exato;

  for (const [en, pt] of Object.entries(mapa)) {
    if (mensagem.toLowerCase().includes(en.toLowerCase())) return pt;
  }

  return mensagem;
}
