"use client";

import { useState, useEffect, useMemo } from "react";
import QRCodeSVG from "react-qr-code";
import { useCampaign } from "@/src/presentation/contexts/CampaignContext";
import { useAuth } from "@/src/presentation/hooks/useAuth";

export function QRCodeSection() {
  const { user } = useAuth();
  const { selectedCampaign } = useCampaign();
  const [shareMessage, setShareMessage] = useState(
    "¡Únete a mi red! Escanea este código QR para registrarte."
  );

  // Generar la URL del QR automáticamente
  const qrUrl = useMemo(() => {
    if (!user || !selectedCampaign) {
      return null;
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const registrationUrl = `${baseUrl}/register/?leaderId=${
      user.id
    }&leaderName=${encodeURIComponent(user.name || "")}&campaignId=${
      selectedCampaign.id
    }`;

    return registrationUrl;
  }, [user, selectedCampaign]);

  useEffect(() => {
    if (selectedCampaign) {
      // Reset message when campaign changes
      setShareMessage(
        `¡Únete a mi red en la campaña ${selectedCampaign.name}! Escanea este código QR para registrarte.`
      );
    }
  }, [selectedCampaign]);

  const downloadQR = () => {
    if (!qrUrl || !selectedCampaign) return;

    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");

      const downloadLink = document.createElement("a");
      downloadLink.download = `qr-code-${selectedCampaign.name.replace(
        /\s+/g,
        "-"
      )}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const shareOnSocialMedia = (platform: string) => {
    if (!qrUrl || !selectedCampaign) return;

    const text = encodeURIComponent(shareMessage);
    const url = encodeURIComponent(qrUrl);

    let shareUrl = "";
    switch (platform) {
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${text}%20${url}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        break;
      default:
        return;
    }

    window.open(shareUrl, "_blank");
  };

  if (!selectedCampaign) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Mi Código QR
        </h3>
        <p className="text-gray-500 text-center py-4">
          Selecciona una campaña para generar el código QR
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Mi Código QR - {selectedCampaign.name}
        </h3>
        <p className="text-gray-500 text-center py-4">
          Cargando información del usuario...
        </p>
      </div>
    );
  }

  if (!qrUrl) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Mi Código QR - {selectedCampaign.name}
        </h3>
        <p className="text-gray-500 text-center py-4">
          No se pudo generar el código QR
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Mi Código QR - {selectedCampaign.name}
      </h3>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* QR Code Section */}
        <div className="flex flex-col items-center space-y-4 flex-shrink-0">
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
            <QRCodeSVG id="qr-code-svg" value={qrUrl} size={200} level="H" />
          </div>
          <button
            onClick={downloadQR}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Descargar QR
          </button>
        </div>

        {/* Share Section */}
        <div className="flex-1 space-y-4">
          <div>
            <label
              htmlFor="share-message"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Mensaje para compartir:
            </label>
            <textarea
              id="share-message"
              value={shareMessage}
              onChange={(e) => setShareMessage(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 placeholder:text-gray-400"
              placeholder="Escribe tu mensaje personalizado..."
            />
            <p className="mt-1 text-xs text-gray-500">
              Este mensaje se usará al compartir en redes sociales
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">
              Compartir en redes sociales:
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => shareOnSocialMedia("whatsapp")}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                title="Compartir en WhatsApp"
              >
                WhatsApp
              </button>
              <button
                onClick={() => shareOnSocialMedia("facebook")}
                className="bg-blue-800 text-white px-4 py-2 rounded-lg hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:ring-offset-2 transition-colors"
                title="Compartir en Facebook"
              >
                Facebook
              </button>
              <button
                onClick={() => shareOnSocialMedia("twitter")}
                className="bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-colors"
                title="Compartir en Twitter"
              >
                Twitter
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
