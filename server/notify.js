// Tells a parent's phones that a report is ready, through Expo's push service.
// This message passes through Expo and Google or Apple, so the words are
// deliberately generic: never a child's name or progress.
import { adminDb } from './firebaseAdmin.js';

const SEND_URL = 'https://exp.host/--/api/v2/push/send';
const RECEIPTS_URL = 'https://exp.host/--/api/v2/push/getReceipts';
const REQUEST_TIMEOUT_MS = 15_000;
const RECEIPT_WAIT_MS = 15 * 60 * 1000; // Expo suggests checking about 15 minutes later

const MESSAGE = {
  title: "Mochi's weekly report is ready",
  body: 'Tap to read it and check the plan.',
  sound: 'default',
  channelId: 'default',
};

async function postJson(url, body, fetchFn) {
  const response = await fetchFn(url, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Expo push service answered ${response.status}`);
  return response.json();
}

const isDeadDevice = (result) => result?.status === 'error' && result.details?.error === 'DeviceNotRegistered';

// Expo's second check, which can reveal phones that have gone since sending.
export async function removeDeadDevicesFromReceipts(devices, tokenForReceipt, fetchFn = fetch) {
  const { data: receipts = {} } = await postJson(RECEIPTS_URL, { ids: [...tokenForReceipt.keys()] }, fetchFn);
  for (const [receiptId, receipt] of Object.entries(receipts)) {
    if (isDeadDevice(receipt)) await devices.doc(tokenForReceipt.get(receiptId)).delete();
  }
}

// Sends to every phone this parent has registered. A notification is only a
// nudge, so a problem here must never break anything else.
export async function notifyParent(uid, fetchFn = fetch) {
  try {
    const devices = adminDb().collection('parents').doc(uid).collection('pushDevices');
    const registered = await devices.get();
    if (registered.empty) return;

    const tokens = registered.docs.map((device) => device.id);
    const { data: tickets = [] } = await postJson(SEND_URL, tokens.map((to) => ({ to, ...MESSAGE })), fetchFn);

    const tokenForReceipt = new Map();
    for (const [index, ticket] of tickets.entries()) {
      if (isDeadDevice(ticket)) await devices.doc(tokens[index]).delete();
      else if (ticket.status === 'ok' && ticket.id) tokenForReceipt.set(ticket.id, tokens[index]);
    }

    if (tokenForReceipt.size > 0) {
      // unref: this wait must not keep the server running by itself.
      setTimeout(() => {
        removeDeadDevicesFromReceipts(devices, tokenForReceipt, fetchFn).catch((err) =>
          console.warn('Could not check notification receipts:', err.message),
        );
      }, RECEIPT_WAIT_MS).unref();
    }
  } catch (err) {
    console.warn('Could not send a notification:', err.message);
  }
}
