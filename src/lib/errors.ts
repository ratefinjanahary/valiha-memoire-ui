export const getErrorMessage = (error: any): string => {
  if (!error.response) {
    return error.message === "Réponse inattendue du serveur"
      ? error.message
      : "Impossible de joindre le serveur. Vérifiez votre connexion.";
  }

  const data = error.response.data;
  const msg = data?.message ?? data?.detail ?? data;

  if (Array.isArray(msg)) {
    return msg
      .map((m) => (typeof m === "string" ? m : m?.msg ?? JSON.stringify(m)))
      .join(", ");
  }
  if (typeof msg === "string") return msg;

  return "Identifiants invalides";
}