import { NextResponse } from "next/server";

export async function GET() {
  // This endpoint is just a placeholder
  return NextResponse.json({ status: "Socket server running" });
}
