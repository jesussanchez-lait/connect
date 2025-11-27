import { NextRequest, NextResponse } from "next/server";

// Mock API endpoint - Replace with actual logout logic
export async function POST(request: NextRequest) {
  // In a real app, you might invalidate the token on the server
  return NextResponse.json({ message: "Logged out successfully" });
}
