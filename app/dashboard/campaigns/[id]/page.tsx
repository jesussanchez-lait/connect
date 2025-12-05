// Server component wrapper - necesario para generateStaticParams
import CampaignDetailPageClient from "../_temp_id/page-client";

// Para export estático, necesitamos generar al menos una ruta estática
// Generamos una ruta dummy que luego se manejará dinámicamente en el cliente
export function generateStaticParams() {
  // Retornar al menos un parámetro para que Next.js pueda generar la página
  return [{ id: "dummy" }];
}

export const dynamicParams = true;

export default function CampaignDetailPage() {
  return <CampaignDetailPageClient />;
}
