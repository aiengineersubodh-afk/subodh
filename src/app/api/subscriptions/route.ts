import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import {
  readDb,
  writeDb,
  hasActivePremiumAccess,
  getActiveStudentSubscription,
  logActivity,
  createNotification,
} from "@/lib/db";
import { SubscriptionPlan, UserSubscription } from "@/types/database";

export async function GET() {
  try {
    const db = readDb();
    const session = await getSessionContext();
    const activePlans = (db.subscription_plans || [])
      .filter((p) => p.is_active)
      .sort((a, b) => a.display_order - b.display_order);
    const enablePremiumSystem =
      db.website_settings.enable_premium_system !== false;
    const freeScholarLimit = db.website_settings.free_scholar_limit || 5;

    if (!session) {
      return NextResponse.json({
        plans: activePlans,
        subscription: null,
        activeSubscription: null,
        pendingSubscription: null,
        hasPremiumAccess: !enablePremiumSystem,
        enablePremiumSystem,
        freeScholarLimit,
        transactions: [],
      });
    }

    const activeSub = getActiveStudentSubscription(db, session.user.id);
    const pendingSub =
      (db.user_subscriptions || [])
        .filter(
          (sub) =>
            sub.student_id === session.user.id &&
            sub.status === "pending_approval"
        )
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0] || null;

    const latestSub =
      activeSub ||
      pendingSub ||
      (db.user_subscriptions || [])
        .filter((sub) => sub.student_id === session.user.id)
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0] ||
      null;

    const hasPremiumAccess = hasActivePremiumAccess(
      db,
      session.user.id,
      session.user.role
    );

    const transactions = (db.subscription_transactions || []).filter(
      (tx) => tx.student_id === session.user.id
    );

    return NextResponse.json({
      plans: activePlans,
      subscription: latestSub,
      activeSubscription:
        activeSub && activeSub.status === "active" ? activeSub : null,
      pendingSubscription: pendingSub,
      hasPremiumAccess,
      enablePremiumSystem,
      freeScholarLimit,
      transactions,
    });
  } catch (error) {
    console.error("Subscriptions GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription information" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionContext();
    if (!session) {
      return NextResponse.json(
        { error: "Please sign in as a student to request STARSKY Premium." },
        { status: 401 }
      );
    }

    if (session.user.role !== "student" && session.user.role !== "admin") {
      return NextResponse.json(
        {
          error:
            "STARSKY Premium memberships are designed for student researchers.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { planId, notes } = body as { planId?: string; notes?: string };

    const db = readDb();
    const plan: SubscriptionPlan | undefined = (
      db.subscription_plans || []
    ).find((p) => p.id === planId && p.is_active);

    if (!plan) {
      return NextResponse.json(
        { error: "Selected subscription plan is not available." },
        { status: 400 }
      );
    }

    const existingSub = getActiveStudentSubscription(db, session.user.id);
    if (
      existingSub &&
      existingSub.status === "active" &&
      new Date(existingSub.expiry_date).getTime() > Date.now()
    ) {
      return NextResponse.json(
        {
          error: "You already have an active STARSKY Premium membership.",
          subscription: existingSub,
        },
        { status: 400 }
      );
    }

    const now = new Date();
    const expiryDate = new Date(
      now.getTime() + plan.duration_days * 24 * 60 * 60 * 1000
    );

    const existingPendingIndex = (db.user_subscriptions || []).findIndex(
      (sub) =>
        sub.student_id === session.user.id && sub.status === "pending_approval"
    );

    let subscription: UserSubscription;
    if (existingPendingIndex >= 0) {
      subscription = {
        ...db.user_subscriptions[existingPendingIndex],
        plan_id: plan.id,
        plan_name: plan.name,
        start_date: now.toISOString(),
        expiry_date: expiryDate.toISOString(),
        notes:
          notes?.trim() ||
          "Pending payment gateway integration or administrator approval.",
        updated_at: now.toISOString(),
      };
      db.user_subscriptions[existingPendingIndex] = subscription;
    } else {
      subscription = {
        id: `sub-${crypto.randomUUID().slice(0, 8)}`,
        student_id: session.user.id,
        student_profile_id: session.studentProfile?.id,
        plan_id: plan.id,
        plan_name: plan.name,
        status: "pending_approval",
        start_date: now.toISOString(),
        expiry_date: expiryDate.toISOString(),
        payment_status: "pending_gateway_or_approval",
        notes:
          notes?.trim() ||
          "Pending payment gateway integration or administrator approval.",
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };
      db.user_subscriptions.unshift(subscription);
    }

    db.subscription_transactions.unshift({
      id: `subtx-${crypto.randomUUID().slice(0, 8)}`,
      subscription_id: subscription.id,
      student_id: session.user.id,
      student_name: session.user.full_name,
      student_email: session.user.email,
      plan_id: plan.id,
      plan_name: plan.name,
      amount: plan.price,
      currency: plan.currency,
      transaction_type: "subscription_request",
      payment_status: "pending_gateway_or_approval",
      notes:
        notes?.trim() ||
        `Requested ${plan.name} (${plan.currency} ${plan.price}). Requires payment gateway verification or admin activation.`,
      actor_id: session.user.id,
      actor_name: session.user.full_name,
      created_at: now.toISOString(),
    });

    // Notify admins
    const admins = db.profiles.filter((u) => u.role === "admin");
    for (const admin of admins) {
      createNotification(db, {
        recipient_profile_id: admin.id,
        title: "New Premium Membership Request",
        message: `${session.user.full_name} requested ${plan.name} (${plan.currency} ${plan.price}). Review in Admin → Premium Management.`,
        type: "info",
        link_url: "/admin",
      });
    }

    createNotification(db, {
      recipient_profile_id: session.user.id,
      title: "Premium Upgrade Request Received",
      message: `Your request for ${plan.name} has been recorded. Your membership will be activated once verified by the payment gateway or approved by an administrator.`,
      type: "info",
      link_url: "/dashboard/student",
    });

    logActivity(db, {
      actor_profile_id: session.user.id,
      actor_name: session.user.full_name,
      actor_role: session.user.role,
      action: "REQUEST_PREMIUM_SUBSCRIPTION",
      entity_type: "user_subscription",
      entity_id: subscription.id,
      details: `${session.user.full_name} (${session.user.email}) requested ${plan.name} (${plan.currency} ${plan.price})`,
    });

    writeDb(db);

    return NextResponse.json({
      message:
        "Your STARSKY Premium subscription request has been submitted. Activation requires payment gateway confirmation or administrator approval.",
      subscription,
    });
  } catch (error) {
    console.error("Subscriptions POST error:", error);
    return NextResponse.json(
      { error: "Failed to submit subscription request" },
      { status: 500 }
    );
  }
}
