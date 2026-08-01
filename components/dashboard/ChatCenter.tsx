"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/client-api";
import type { SessionUser } from "@/lib/auth";
import { ChatMediaComposer } from "@/components/dashboard/ChatMediaComposer";
import { ChatMediaMessage, type ChatMedia } from "@/components/dashboard/ChatMediaMessage";

type Conversation = {
  id: string;
  kind: string;
  subject: string;
  status: string;
  counterpartName: string;
  storeName?: string;
  lastMessage?: string;
  lastMessageAt: number;
  unreadCount: number;
  blocked: number;
};
type Message = ChatMedia & {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  body: string;
  deliveredAt: number;
  createdAt: number;
  isRead: number;
  type?: string;
};
type UserItem = { id: string; name: string; email: string; role: string };

function prettyTime(value: number) {
  return new Date(value * 1000).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

export function ChatCenter({ user }: { user: SessionUser }) {
  const initialConversation = useSearchParams().get("conversation") ?? "";
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [users, setUsers] = useState<UserItem[]>([]);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const selected = useMemo(() => conversations.find((item) => item.id === selectedId), [conversations, selectedId]);

  const loadConversations = useCallback(async () => {
    const params = new URLSearchParams({ q: query, status, role });
    const result = await apiFetch<{ items: Conversation[] }>(`/api/chat?${params}`);
    setConversations(result.items);
    setSelectedId((current) => current && result.items.some((item) => item.id === current) ? current : result.items.find((item) => item.id === initialConversation)?.id ?? result.items[0]?.id ?? "");
  }, [initialConversation, query, role, status]);

  useEffect(() => {
    setLoading(true);
    loadConversations().catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load chats.")).finally(() => setLoading(false));
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedId) { setMessages([]); return; }
    let active = true;
    apiFetch<{ items: Message[] }>(`/api/chat?conversationId=${encodeURIComponent(selectedId)}`)
      .then(async (result) => {
        if (!active) return;
        setMessages(result.items);
        await apiFetch("/api/chat", { method: "PATCH", json: { action: "mark_read", conversationId: selectedId } });
        await loadConversations();
      })
      .catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load messages."); });
    const source = new EventSource(`/api/chat/stream?conversationId=${encodeURIComponent(selectedId)}&after=0`);
    source.addEventListener("messages", (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as { items: Message[] };
      setMessages((current) => {
        const map = new Map(current.map((item) => [item.id, item]));
        payload.items.forEach((item) => map.set(item.id, item));
        return [...map.values()].sort((left, right) => left.createdAt - right.createdAt || left.id.localeCompare(right.id));
      });
      void apiFetch("/api/chat", { method: "PATCH", json: { action: "mark_read", conversationId: selectedId } });
    });
    source.onerror = () => {
      // EventSource reconnects automatically after the server's bounded polling window.
    };
    return () => { active = false; source.close(); };
  }, [selectedId, loadConversations]);

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const message = String(new FormData(form).get("message") ?? "");
    if (!selectedId || !message.trim()) return;
    setSending(true); setError("");
    try {
      await apiFetch("/api/chat", { method: "POST", json: { action: "send", conversationId: selectedId, message, clientNonce: crypto.randomUUID() } });
      form.reset();
      const result = await apiFetch<{ items: Message[] }>(`/api/chat?conversationId=${encodeURIComponent(selectedId)}`);
      setMessages(result.items);
      await loadConversations();
    } catch (sendError) { setError(sendError instanceof Error ? sendError.message : "Message could not be sent."); }
    finally { setSending(false); }
  }

  async function refreshMessages() {
    if (!selectedId) return;
    const result = await apiFetch<{ items: Message[] }>(`/api/chat?conversationId=${encodeURIComponent(selectedId)}`);
    setMessages(result.items);
    await loadConversations();
  }

  async function deleteMedia(message: Message) {
    if (!message.mediaId || !window.confirm("Delete this media message permanently?")) return;
    try {
      await apiFetch("/api/chat/media", { method: "DELETE", json: { mediaId: message.mediaId } });
      await refreshMessages();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Media could not be deleted.");
    }
  }

  async function reportOrBlock(action: "report" | "block") {
    if (!selectedId) return;
    const reason = window.prompt(action === "report" ? "Why are you reporting this conversation?" : "Why are you blocking this user?");
    if (!reason) return;
    try { await apiFetch("/api/chat", { method: "POST", json: { action, conversationId: selectedId, reason } }); await loadConversations(); }
    catch (actionError) { setError(actionError instanceof Error ? actionError.message : "Action failed."); }
  }

  async function searchUsers(value: string) {
    if (value.trim().length < 2) { setUsers([]); return; }
    try {
      const result = await apiFetch<{ items: UserItem[] }>(`/api/admin/users?q=${encodeURIComponent(value)}&status=active`);
      setUsers(result.items.filter((item) => item.role !== "admin").slice(0, 20));
    } catch { setUsers([]); }
  }

  async function startAdminChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    try {
      const result = await apiFetch<{ id: string }>("/api/chat", { method: "POST", json: { action: "start_admin", ...values } });
      form.reset(); setUsers([]); await loadConversations(); setSelectedId(result.id);
    } catch (actionError) { setError(actionError instanceof Error ? actionError.message : "Conversation could not be created."); }
  }

  async function setResolution(action: "resolve" | "reopen") {
    if (!selectedId) return;
    try { await apiFetch("/api/chat", { method: "PATCH", json: { action, conversationId: selectedId } }); await loadConversations(); }
    catch (actionError) { setError(actionError instanceof Error ? actionError.message : "Conversation could not be updated."); }
  }

  return <>
    <div className="portalTitleRow"><div><span className="portalEyebrow">{user.role === "admin" ? "Support operations" : "Private messaging"}</span><h1>{user.role === "admin" ? "Admin Chat Center" : "Messages"}</h1><p>Encrypted in transit, securely stored, and visible only to authorized participants.</p></div></div>
    {error && <p className="authError" role="alert">{error}</p>}
    {user.role === "admin" && <form className="chatStart" onSubmit={startAdminChat}>
      <label>Find a customer or shop owner<input type="search" placeholder="Search name or email" onChange={(event) => void searchUsers(event.target.value)} /></label>
      <label>User<select name="userId" required><option value="">Select user</option>{users.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.role.replace("_", " ")} · {item.email}</option>)}</select></label>
      <label>Subject<input name="subject" required minLength={3} maxLength={120} placeholder="How can Kynisto help?" /></label>
      <button className="portalButton" type="submit">Start conversation</button>
    </form>}
    <div className="chatFilters">
      <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search conversations" aria-label="Search chats" />
      {user.role === "admin" && <select value={role} onChange={(event) => setRole(event.target.value)} aria-label="Filter participant role"><option value="">All people</option><option value="customer">Customers</option><option value="store_owner">Shop owners</option></select>}
      <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter status"><option value="">All statuses</option><option value="pending">Pending</option><option value="open">Open</option><option value="resolved">Resolved</option></select>
    </div>
    <section className="chatShell" aria-label="Conversations">
      <aside className="chatList">
        {loading && <p className="chatEmpty">Loading conversations…</p>}
        {!loading && !conversations.length && <p className="chatEmpty">No conversations match these filters.</p>}
        {conversations.map((item) => <button key={item.id} type="button" className={item.id === selectedId ? "active" : ""} onClick={() => setSelectedId(item.id)}>
          <span className="chatAvatar">{(item.counterpartName || item.storeName || "N").slice(0, 1).toUpperCase()}</span>
          <span><b>{item.counterpartName || item.storeName}</b><small>{item.kind === "support" ? "Support ticket" : item.subject}</small><em>{item.lastMessage || "Conversation started"}</em></span>
          <time>{prettyTime(item.lastMessageAt)}</time>{Number(item.unreadCount) > 0 && <i>{item.unreadCount}</i>}
        </button>)}
      </aside>
      <div className="chatThread">
        {!selected ? <div className="chatWelcome"><span>•••</span><h2>Select a conversation</h2><p>Messages, delivery status and read receipts will appear here.</p></div> : <>
          <header><div><b>{selected.counterpartName || selected.storeName}</b><small>{selected.subject} · <span className={`statusPill ${selected.status}`}>{selected.status}</span></small></div><div>
            {user.role === "admin" ? <button type="button" onClick={() => void setResolution(selected.status === "resolved" ? "reopen" : "resolve")}>{selected.status === "resolved" ? "Reopen" : "Resolve"}</button> : <><button type="button" onClick={() => void reportOrBlock("report")}>Report</button>{!selected.blocked && <button type="button" onClick={() => void reportOrBlock("block")}>Block</button>}</>}
          </div></header>
          <div className="chatMessages" aria-live="polite">
            {messages.map((message) => <article key={message.id} className={message.senderId === user.id ? "mine" : "theirs"}><small>{message.senderId === user.id ? "You" : message.senderName}</small>{message.mediaUrl && <ChatMediaMessage message={message} canDelete={message.senderId === user.id || user.role === "admin"} onDelete={() => deleteMedia(message)} />}<p>{message.caption || message.body}</p><time>{prettyTime(message.createdAt)}{message.senderId === user.id ? message.isRead ? " · Read" : " · Delivered" : ""}</time></article>)}
            <div ref={messagesEnd} />
          </div>
          <ChatMediaComposer conversationId={selectedId} disabled={Boolean(selected.blocked) || selected.status === "resolved"} onSent={refreshMessages} onError={setError} />
          <form className="chatComposer" onSubmit={send}><label className="srOnly" htmlFor="chat-message">Message</label><textarea id="chat-message" name="message" required maxLength={2000} placeholder={selected.blocked ? "Messaging is blocked" : selected.status === "resolved" ? "Reopen to reply" : "Write a message…"} disabled={Boolean(selected.blocked) || selected.status === "resolved"} /><button className="portalButton" type="submit" disabled={sending || Boolean(selected.blocked) || selected.status === "resolved"}>{sending ? "Sending…" : "Send"}</button></form>
        </>}
      </div>
    </section>
  </>;
}
