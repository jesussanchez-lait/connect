"use client";

import { useState, useEffect, useCallback } from "react";
import QRCodeSVG from "react-qr-code";
import { ApiClient } from "@/src/infrastructure/api/ApiClient";

interface QRCodeData {
  qrData: string;
  userId: string;
}

export function QRCodeSection() {
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const apiClient = new ApiClient();

  const fetchQRCode = useCallback(async () => {
    try {
      const data = await apiClient.get<QRCodeData>("/dashboard/qr-code");
      setQrData(data);
    } catch (error) {
      console.error("Error fetching QR code:", error);
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchQRCode();
  }, [fetchQRCode]);

  const downloadQR = () => {
    if (!qrData) return;

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
      downloadLink.download = `qr-code-${qrData.userId}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const shareOnSocialMedia = (platform: string) => {
    if (!qrData) return;

    const text = encodeURIComponent(
      "¡Únete a mi red! Escanea este código QR para registrarte."
    );
    const url = encodeURIComponent(qrData.qrData);

    let shareUrl = "";
    switch (platform) {
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${text}%20${url}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        break;
      default:
        return;
    }

    window.open(shareUrl, "_blank");
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!qrData) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">Error al cargar código QR</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Mi Código QR</h3>
      <div className="flex flex-col items-center space-y-4">
        <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
          <QRCodeSVG
            id="qr-code-svg"
            value={qrData.qrData}
            size={200}
            level="H"
            includeMargin={true}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <button
            onClick={downloadQR}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Descargar QR
          </button>
        </div>
        <div className="w-full">
          <p className="text-sm text-gray-600 mb-2 text-center">
            Compartir en redes sociales:
          </p>
          <div className="flex gap-2 justify-center">
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
  );
}
