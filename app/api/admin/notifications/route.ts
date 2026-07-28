import { NextResponse } from "next/server";
import { getSessionUser, requireApiSession } from "@/lib/auth";
import {
  createSystemNotification,
  deleteSystemNotification,
  getSystemNotifications,
} from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized admin access." }, { status: 403 });
    }

    const items = await getSystemNotifications(50);
    return NextResponse.json({ items });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch notifications." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized admin access." }, { status: 403 });
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const { title, message, targetRole = "all", targetUserId = "", url = "", type = "info" } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Notification Title is required." }, { status: 400 });
    }
    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Notification Message is required." }, { status: 400 });
    }

    const notif = await createSystemNotification({
      title: title.trim(),
      message: message.trim(),
      target_role: targetRole,
      target_user_id: targetUserId.trim() || undefined,
      url: url.trim() || undefined,
      type,
      sender_name: session.user.name || "Kynisto Admin",
    });

    return NextResponse.json({ success: true, notification: notif });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to broadcast notification." }, { status: err.status || 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized admin access." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Notification ID required." }, { status: 400 });
    }

    await deleteSystemNotification(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete notification." }, { status: err.status || 500 });
  }
}
