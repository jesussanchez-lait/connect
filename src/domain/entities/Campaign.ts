export interface Campaign {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: "active" | "inactive" | "completed";
  participants: number;
  createdAt: Date;
  updatedAt?: Date;
}
