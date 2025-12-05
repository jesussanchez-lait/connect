import CampaignDetailPageClient from "./page-client";

// Necesario para export estático de Next.js
// Retornamos array vacío para que todas las rutas se manejen dinámicamente en el cliente
export function generateStaticParams() {
  return [];
}

export const dynamicParams = true;

export default function CampaignDetailPage() {
  return <CampaignDetailPageClient />;
}
