"use client";

interface WhatsAppConsentCheckboxProps {
  value: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}

export function WhatsAppConsentCheckbox({
  value,
  onChange,
  error,
}: WhatsAppConsentCheckboxProps) {
  return (
    <div className="space-y-2">
      <label className="flex items-start space-x-3 cursor-pointer">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          required
        />
        <span className="text-sm text-gray-700 flex-1">
          Autorizo el envío de información de campaña, noticias y alertas a
          través de WhatsApp. Entiendo que puedo revocar este permiso en
          cualquier momento desde mi perfil.
        </span>
      </label>
      {error && <p className="text-sm text-red-600 ml-7">{error}</p>}
    </div>
  );
}
