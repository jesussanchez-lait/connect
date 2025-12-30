"use client";

import { useState, useEffect, useRef } from "react";
import { useCampaign } from "@/src/presentation/contexts/CampaignContext";
import { useAuth } from "@/src/presentation/hooks/useAuth";
import { CampaignBrochureService } from "@/src/infrastructure/storage/CampaignBrochureService";

export function CampaignBrochureManager() {
  const { selectedCampaigns } = useCampaign();
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [brochureUrl, setBrochureUrl] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if brochure exists for selected campaigns
  useEffect(() => {
    const checkBrochures = async () => {
      if (selectedCampaigns.length === 0) {
        setBrochureUrl(null);
        return;
      }

      // For now, check the first selected campaign
      // You might want to show brochures for all selected campaigns
      if (selectedCampaigns.length === 1) {
        setChecking(true);
        try {
          const url = await CampaignBrochureService.getBrochureURL(
            selectedCampaigns[0].id
          );
          setBrochureUrl(url);
        } catch (error) {
          console.error("Error checking brochure:", error);
          setBrochureUrl(null);
        } finally {
          setChecking(false);
        }
      }
    };

    checkBrochures();
  }, [selectedCampaigns]);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (selectedCampaigns.length === 0) {
      alert("Por favor selecciona una campaña primero");
      return;
    }

    if (selectedCampaigns.length > 1) {
      alert("Por favor selecciona solo una campaña para subir el PDF");
      return;
    }

    if (file.type !== "application/pdf") {
      alert("El archivo debe ser un PDF");
      return;
    }

    setUploading(true);
    try {
      const downloadURL = await CampaignBrochureService.uploadBrochure(
        selectedCampaigns[0].id,
        file
      );
      setBrochureUrl(downloadURL);
      alert("PDF subido exitosamente");
    } catch (error: any) {
      console.error("Error uploading brochure:", error);
      alert(error.message || "Error al subir el PDF");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async () => {
    if (selectedCampaigns.length === 0) {
      alert("Por favor selecciona una campaña primero");
      return;
    }

    if (selectedCampaigns.length > 1) {
      alert("Por favor selecciona solo una campaña para eliminar el PDF");
      return;
    }

    if (
      !confirm(
        "¿Estás seguro de que deseas eliminar el PDF de la propuesta de esta campaña?"
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      await CampaignBrochureService.deleteBrochure(selectedCampaigns[0].id);
      setBrochureUrl(null);
      alert("PDF eliminado exitosamente");
    } catch (error: any) {
      console.error("Error deleting brochure:", error);
      alert(error.message || "Error al eliminar el PDF");
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = () => {
    if (brochureUrl) {
      window.open(brochureUrl, "_blank");
    }
  };

  if (selectedCampaigns.length === 0) {
    return null;
  }

  if (selectedCampaigns.length > 1) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-3">
        <p className="text-sm text-yellow-800">
          Selecciona solo una campaña para gestionar el PDF de la propuesta
        </p>
      </div>
    );
  }

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 sm:p-4 mb-3">
      <div className="flex items-start">
        <svg
          className="w-5 h-5 text-indigo-600 mt-0.5 mr-3 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-indigo-800 mb-2">
            PDF de Propuesta de Campaña
          </h3>
          <p className="text-xs text-indigo-700 mb-3">
            {selectedCampaigns[0].name}
          </p>

          {checking ? (
            <p className="text-sm text-indigo-600">Verificando...</p>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="brochure-upload"
              />
              <label
                htmlFor="brochure-upload"
                className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  uploading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <span>
                  {uploading
                    ? "Subiendo..."
                    : brochureUrl
                    ? "Reemplazar PDF"
                    : "Subir PDF"}
                </span>
              </label>

              {brochureUrl && (
                <>
                  <button
                    onClick={handleDownload}
                    className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors text-sm font-medium"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span>Ver PDF</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    <span>{deleting ? "Eliminando..." : "Eliminar"}</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
