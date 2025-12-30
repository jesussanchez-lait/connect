import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  StorageReference,
} from "firebase/storage";
import { app } from "../firebase/config";

const STORAGE_BUCKET = "connect-tierra.firebasestorage.app";
const BROCHURE_FOLDER = "campaign_brochure";

/**
 * Service to manage campaign brochure PDFs in Firebase Storage
 */
export class CampaignBrochureService {
  private static getStorageRef(campaignId: string): StorageReference {
    const storage = getStorage(app, `gs://${STORAGE_BUCKET}`);
    const fileName = `${BROCHURE_FOLDER}/campaign_brochure_${campaignId}.pdf`;
    return ref(storage, fileName);
  }

  /**
   * Upload a PDF brochure for a campaign
   * @param campaignId - The campaign ID
   * @param file - The PDF file to upload
   * @returns The download URL of the uploaded file
   */
  static async uploadBrochure(campaignId: string, file: File): Promise<string> {
    try {
      const storageRef = this.getStorageRef(campaignId);

      // Validate file type
      if (file.type !== "application/pdf") {
        throw new Error("El archivo debe ser un PDF");
      }

      // Upload the file
      await uploadBytes(storageRef, file);

      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error: any) {
      console.error("Error uploading brochure:", error);
      throw new Error(error.message || "Error al subir el PDF de la propuesta");
    }
  }

  /**
   * Get the download URL for a campaign brochure
   * @param campaignId - The campaign ID
   * @returns The download URL or null if the file doesn't exist
   */
  static async getBrochureURL(campaignId: string): Promise<string | null> {
    try {
      const storageRef = this.getStorageRef(campaignId);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error: any) {
      // File doesn't exist or other error
      if (error.code === "storage/object-not-found") {
        return null;
      }
      console.error("Error getting brochure URL:", error);
      throw new Error(error.message || "Error al obtener la URL del PDF");
    }
  }

  /**
   * Delete a campaign brochure
   * @param campaignId - The campaign ID
   */
  static async deleteBrochure(campaignId: string): Promise<void> {
    try {
      const storageRef = this.getStorageRef(campaignId);
      await deleteObject(storageRef);
    } catch (error: any) {
      // If file doesn't exist, that's fine
      if (error.code === "storage/object-not-found") {
        return;
      }
      console.error("Error deleting brochure:", error);
      throw new Error(error.message || "Error al eliminar el PDF");
    }
  }

  /**
   * Check if a brochure exists for a campaign
   * @param campaignId - The campaign ID
   * @returns True if the brochure exists, false otherwise
   */
  static async brochureExists(campaignId: string): Promise<boolean> {
    try {
      const url = await this.getBrochureURL(campaignId);
      return url !== null;
    } catch {
      return false;
    }
  }
}
