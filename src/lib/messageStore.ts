// Shared in-memory message store (simulates backend)
// In production this would be replaced with Supabase/API calls

export interface InternalMessage {
  id: string;
  toUserId: string;
  toUserName: string;
  fromAdmin: string;
  text: string;
  imageUrl?: string;
  sentAt: string;
  read: boolean;
}

// Global store accessible across components
let messages: InternalMessage[] = [];
let listeners: (() => void)[] = [];

export function getMessages(): InternalMessage[] {
  return [...messages];
}

export function getMessagesForUser(userId: string): InternalMessage[] {
  return messages.filter((m) => m.toUserId === userId);
}

export function sendMessage(msg: Omit<InternalMessage, 'id' | 'sentAt' | 'read'>): InternalMessage {
  const newMsg: InternalMessage = {
    ...msg,
    id: `msg-${Date.now()}`,
    sentAt: new Date().toISOString(),
    read: false,
  };
  messages = [newMsg, ...messages];
  listeners.forEach((fn) => fn());
  return newMsg;
}

export function markAllReadForUser(userId: string) {
  messages = messages.map((m) =>
    m.toUserId === userId ? { ...m, read: true } : m
  );
  listeners.forEach((fn) => fn());
}

export function subscribeToMessages(fn: () => void) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

export function getUnreadCountForUser(userId: string): number {
  return messages.filter((m) => m.toUserId === userId && !m.read).length;
}
