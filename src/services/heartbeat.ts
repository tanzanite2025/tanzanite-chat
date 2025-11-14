import { BASE_URL } from '../config';

export type ContactStatus = { id: string; online: boolean; lastSeen?: number };

export async function fetchBatchStatus(userId: string): Promise<ContactStatus[]> {
  try {
    const url = `${BASE_URL}/api/chat/heartbeat?uid=${encodeURIComponent(userId)}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return (data && Array.isArray(data.contacts)) ? data.contacts : [];
  } catch (e) {
    console.warn('[heartbeat] batch error', e);
    return [];
  }
}

export async function fetchChatStatus(chatId: string): Promise<{ online: boolean; lastSeen?: number } | null> {
  try {
    const url = `${BASE_URL}/api/chat/status?chatId=${encodeURIComponent(chatId)}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data && typeof data.online === 'boolean') return data;
    return null;
  } catch (e) {
    console.warn('[heartbeat] single error', e);
    return null;
  }
}
