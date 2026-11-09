/** Extrait un message lisible d'une erreur axios renvoyée par NestJS (message: string | string[]). */
export function getApiErrorMessage(error: any, fallback = "Une erreur est survenue"): string {
  // Limite par IP (@nestjs/throttler) : message générique, le défaut Nest est en anglais
  if (error?.response?.status === 429) return "Trop de tentatives, réessayez dans quelques minutes";
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) return message.join(", ");
  if (typeof message === "string") return message;
  if (!error?.response) return "Erreur réseau, veuillez réessayer";
  return fallback;
}
