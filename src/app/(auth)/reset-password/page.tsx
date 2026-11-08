import type { Metadata } from "next";
import { ResetPasswordForm } from "./reset-password-form";

// SÉCURITÉ : le token est dans l'URL. Empêche sa fuite via l'en-tête Referer
// si la page charge une ressource externe.
export const metadata: Metadata = {
  title: "Réinitialiser le mot de passe",
  referrer: "no-referrer",
  robots: { index: false },
};

// Next 15+ : searchParams est une Promise. (Next 14 : objet direct, retire le Promise<> et le await.)
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  return <ResetPasswordForm token={typeof token === "string" ? token : null} />;
}