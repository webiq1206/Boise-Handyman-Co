import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { leads, users, leadPurchases } from "@/shared/schema";
import { eq } from "drizzle-orm";
import { getSession, getUserFromDb } from "@/lib/auth";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// One-time fixups for stuck purchases. The previous brand's legacy entries
// (with customer PII) were removed when this codebase became Boise Handyman Co;
// add entries here only for a specific stuck payment, then remove them again.
const KNOWN_UNRESOLVED_PURCHASES: {
  leadId: string;
  userId: string;
  purchasePrice: string;
  label: string;
}[] = [];

async function resolveLeadPurchase(leadId: string, userId: string, purchasePrice: string, piId?: string) {
  if (!db) throw new Error("Database not available");

  const leadResults = await db.select().from(leads).where(eq(leads.id, leadId));
  const lead = leadResults[0];
  if (!lead) return { skipped: true, reason: "Lead not found" };

  const existingPurchase = await db.select().from(leadPurchases).where(eq(leadPurchases.leadId, leadId));
  if (existingPurchase.length > 0) return { skipped: true, reason: "Purchase record already exists" };

  const resolvedPiId = piId || `pi_admin_resolved_${Date.now()}`;

  const [purchase] = await db.insert(leadPurchases).values({
    leadId: lead.id,
    userId,
    purchasePrice: purchasePrice || lead.currentLeadPrice || "0",
    stripePaymentIntentId: resolvedPiId,
  }).returning();

  let updatedLead = lead;
  if (lead.status !== "purchased") {
    const [updated] = await db.update(leads).set({
      status: "purchased",
      purchasedBy: userId,
      purchasedAt: new Date(),
      purchasePrice: purchasePrice || lead.currentLeadPrice,
      stripePaymentIntentId: resolvedPiId,
    }).where(eq(leads.id, leadId)).returning();
    updatedLead = updated;
  }

  return { success: true, purchase, lead: updatedLead, stripePaymentIntentId: resolvedPiId };
}

export async function GET() {
  try {
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }

    const session = await getSession();
    if (!session.userId) {
      return NextResponse.json({ error: "Unauthorized - please log in as admin first" }, { status: 401 });
    }

    const adminUser = await getUserFromDb(session.userId);
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: admin access required" }, { status: 403 });
    }

    const results = [];
    for (const entry of KNOWN_UNRESOLVED_PURCHASES) {
      try {
        const result = await resolveLeadPurchase(entry.leadId, entry.userId, entry.purchasePrice);
        results.push({ ...entry, ...result });
      } catch (e) {
        results.push({ ...entry, error: e instanceof Error ? e.message : "Unknown error" });
      }
    }

    return NextResponse.json({
      message: "Resolve payment check complete",
      results,
    });
  } catch (error) {
    console.error("Error in GET resolve-payment:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to resolve payments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }

    const session = await getSession();
    if (!session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await getUserFromDb(session.userId);
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { leadId, userId, stripePaymentIntentId: manualPiId } = body;

    if (!leadId || !userId) {
      return NextResponse.json({ error: "Both leadId and userId are required" }, { status: 400 });
    }

    const userResults = await db.select().from(users).where(eq(users.id, userId));
    if (userResults.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let resolvedPiId = manualPiId || null;

    if (!resolvedPiId && stripe) {
      const paymentIntents = await stripe.paymentIntents.search({
        query: `metadata["leadId"]:"${leadId}" AND metadata["userId"]:"${userId}" AND status:"succeeded"`,
      });

      if (paymentIntents.data.length > 0) {
        resolvedPiId = paymentIntents.data[0].id;
      }
    }

    const leadResults = await db.select().from(leads).where(eq(leads.id, leadId));
    const lead = leadResults[0];
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const result = await resolveLeadPurchase(leadId, userId, lead.currentLeadPrice || "0", resolvedPiId || undefined);

    if (result.skipped) {
      return NextResponse.json({ message: result.reason }, { status: 409 });
    }

    try {
      const { sendLeadPurchasedNotification, sendLeadPurchaseConfirmation } = await import("@/server/services/emailNotifications");
      const targetUser = userResults[0];
      const buyerEmail = targetUser.email || '';
      const buyerName = [targetUser.firstName, targetUser.lastName].filter(Boolean).join(' ') || targetUser.email || 'Subcontractor';

      if (result.lead) {
        sendLeadPurchaseConfirmation(
          buyerEmail,
          {
            id: result.lead.id,
            name: result.lead.name,
            email: result.lead.email,
            phone: result.lead.phone || "",
            city: result.lead.city,
            serviceType: result.lead.serviceType,
            finalQuote: result.lead.finalQuote || "0",
            address: result.lead.address || undefined,
          }
        ).catch(() => {});

        sendLeadPurchasedNotification(
          {
            id: result.lead.id,
            name: result.lead.name,
            email: result.lead.email,
            phone: result.lead.phone || "",
            city: result.lead.city,
            serviceType: result.lead.serviceType,
            finalQuote: result.lead.finalQuote || "0",
            address: result.lead.address || undefined,
            purchasePrice: result.lead.purchasePrice || lead.currentLeadPrice || "0",
          },
          {
            name: buyerName,
            email: buyerEmail,
          }
        ).catch(() => {});
      }
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: `Payment resolved. Lead ${leadId} is now marked as purchased by user ${userId}.`,
      ...result,
    });
  } catch (error) {
    console.error("Error resolving payment:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to resolve payment" },
      { status: 500 }
    );
  }
}
