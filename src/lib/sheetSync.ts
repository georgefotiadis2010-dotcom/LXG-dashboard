import type { LxgState } from '../types/lxg';

export type SheetAction = 'UPDATE_METRICS' | 'ADD_REEL' | 'TOGGLE_CHECKLIST';

export interface SheetSyncResponse {
  ok: boolean;
  state?: Partial<LxgState>;
  error?: string;
}

export function isSyncConfigured(webAppUrl?: string, secretKey?: string): boolean {
  return Boolean(webAppUrl?.trim() && secretKey?.trim());
}

export async function fetchSheetState(
  webAppUrl: string,
  secretKey: string
): Promise<SheetSyncResponse> {
  const baseUrl = webAppUrl.trim();
  const separator = baseUrl.includes('?') ? '&' : '?';
  const url = `${baseUrl}${separator}key=${encodeURIComponent(secretKey.trim())}`;

  const response = await fetch(url, {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Sheet GET failed with status ${response.status}`);
  }

  const data = (await response.json()) as SheetSyncResponse;
  if (!data.ok) {
    throw new Error(data.error || 'Sheet GET returned ok: false');
  }

  return data;
}

export async function postSheetMutation(
  webAppUrl: string,
  secretKey: string,
  action: SheetAction,
  payload: unknown
): Promise<SheetSyncResponse> {
  const response = await fetch(webAppUrl.trim(), {
    method: 'POST',
    // text/plain;charset=utf-8 avoids CORS preflight on Google Apps Script Web Apps
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({
      key: secretKey.trim(),
      action,
      payload,
    }),
  });

  if (!response.ok) {
    throw new Error(`Sheet POST (${action}) failed with status ${response.status}`);
  }

  const data = (await response.json()) as SheetSyncResponse;
  if (!data.ok) {
    throw new Error(data.error || `Sheet POST (${action}) returned ok: false`);
  }

  return data;
}
