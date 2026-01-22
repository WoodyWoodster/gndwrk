import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    }

    // Retrieve the verification session
    const session = await stripe.identity.verificationSessions.retrieve(sessionId);

    return NextResponse.json({
      status: session.status,
      lastError: session.last_error,
    });
  } catch (error) {
    console.error("Error checking identity status:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check verification status" },
      { status: 500 }
    );
  }
}
