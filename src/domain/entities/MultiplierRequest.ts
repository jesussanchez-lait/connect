export type MultiplierRequestStatus = "pending" | "approved" | "rejected";

export interface MultiplierRequest {
  id: string;
  userId: string;
  userName: string;
  userPhoneNumber: string;
  campaignId: string;
  campaignName?: string;
  status: MultiplierRequestStatus;
  requestedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewerName?: string;
  rejectionReason?: string;
}
