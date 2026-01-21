import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@gndwrk/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

type WebhookEvent = {
  type: string;
  data: {
    id: string;
    email_addresses?: Array<{ email_address: string }>;
    first_name?: string;
    last_name?: string;
    image_url?: string;
    [key: string]: unknown;
  };
};

export async function POST(req: Request) {
  const headersList = await headers();
  const svixId = headersList.get("svix-id");
  const svixTimestamp = headersList.get("svix-timestamp");
  const svixSignature = headersList.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  let event: WebhookEvent;

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "user.created":
        await convex.mutation(api.users.createFromClerk, {
          clerkId: event.data.id,
          email: event.data.email_addresses?.[0]?.email_address ?? "",
          firstName: event.data.first_name ?? "",
          lastName: event.data.last_name ?? "",
          imageUrl: event.data.image_url,
        });
        break;

      case "user.updated":
        await convex.mutation(api.users.updateFromClerk, {
          clerkId: event.data.id,
          email: event.data.email_addresses?.[0]?.email_address,
          firstName: event.data.first_name,
          lastName: event.data.last_name,
          imageUrl: event.data.image_url,
        });
        break;

      case "user.deleted":
        await convex.mutation(api.users.deleteFromClerk, {
          clerkId: event.data.id,
        });
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
