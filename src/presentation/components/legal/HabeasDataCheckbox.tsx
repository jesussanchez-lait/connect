"use client";

import { useState } from "react";
import { ConsentModal } from "./ConsentModal";

// Texto completo de la política según Anexo B del PDF
const FULL_POLICY_TEXT = `AUTORIZACIÓN EXPRESA E INFORMADA

En cumplimiento del Régimen General de Protección de Datos Personales (Ley 1581 de 2012), autorizo al Candidato/Campaña ("El Responsable") y a sus proveedores tecnológicos ("Encargados") para tratar mis datos bajo las siguientes finalidades técnicas:

- Gestión de Estructura Política: Procesamiento de mi afiliación política (Dato Sensible) para la organización de equipos territoriales y asignación de roles de liderazgo.

- Georreferenciación Operativa: Captura y procesamiento de mis coordenadas geográficas (GPS) y dirección domiciliaria para la asignación de puestos de votación y zonificación territorial.

- Canales de Mensajería: Envío de información de campaña, noticias y alertas a través de servicios de mensajería instantánea (WhatsApp/SMS), entendiendo que puedo revocar este permiso específico en cualquier momento.

- Auditoría y Seguridad: Registro de mi dirección IP y huella digital del dispositivo para prevención de fraudes y duplicidad de identidad.

- Retención Técnica en Respaldos (Permanencia Residual): Entiendo y acepto que, en caso de solicitar la eliminación de mi cuenta, mis datos personales permanecerán almacenados de forma encriptada e inactiva ("Fuera de Uso") en las copias de seguridad del sistema por un periodo técnico máximo de 30 días, con el único fin de garantizar la integridad ante desastres informáticos, tras lo cual serán destruidos definitivamente de forma automática.

DERECHOS DEL TITULAR: Declaro conocer mi derecho a consultar, actualizar, rectificar y solicitar la supresión de mis datos ("Derecho al Olvido"), procedimiento que podré ejercer a través de los canales oficiales de la campaña o mediante las herramientas de gestión de perfil dispuestas en la aplicación.`;

// Texto corto para el checkbox según Anexo A del PDF
const SHORT_TEXT =
  "Autorizo el tratamiento de mis datos personales, incluidos los sensibles (afiliación política) y la geolocalización (GPS), para la gestión de la campaña y el contacto vía WhatsApp según la Política de Privacidad.";

interface HabeasDataCheckboxProps {
  value: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}

export function HabeasDataCheckbox({
  value,
  onChange,
  error,
}: HabeasDataCheckboxProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="space-y-2">
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => onChange(e.target.checked)}
            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            required
          />
          <span className="text-sm text-gray-700 flex-1">
            {SHORT_TEXT}{" "}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setShowModal(true);
              }}
              className="text-blue-600 hover:text-blue-700 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              Ver Política Completa
            </button>
          </span>
        </label>
        {error && <p className="text-sm text-red-600 ml-7">{error}</p>}
      </div>

      <ConsentModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAccept={() => {
          onChange(true);
          setShowModal(false);
        }}
        title="Política de Tratamiento de Datos Personales - Ley 1581 de 2012"
        content={FULL_POLICY_TEXT}
      />
    </>
  );
}
