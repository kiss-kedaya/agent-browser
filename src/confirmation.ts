import { randomBytes } from 'node:crypto';

interface PendingConfirmation {
  id: string;
  action: string;
  category: string;
  description: string;
  command: Record<string, unknown>;
  resolve: (approved: boolean) => void;
  timer: ReturnType<typeof setTimeout>;
}

const AUTO_DENY_TIMEOUT_MS = 60_000;

const pending = new Map<string, PendingConfirmation>();

function generateId(): string {
  return `c_${randomBytes(4).toString('hex')}`;
}

export function requestConfirmation(
  action: string,
  category: string,
  description: string,
  command: Record<string, unknown>
): { confirmationId: string; promise: Promise<boolean> } {
  const id = generateId();

  const promise = new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      resolve(false);
    }, AUTO_DENY_TIMEOUT_MS);

    pending.set(id, {
      id,
      action,
      category,
      description,
      command,
      resolve,
      timer,
    });
  });

  return { confirmationId: id, promise };
}

export function resolveConfirmation(id: string, approved: boolean): boolean {
  const entry = pending.get(id);
  if (!entry) return false;

  clearTimeout(entry.timer);
  pending.delete(id);
  entry.resolve(approved);
  return true;
}

export function hasPendingConfirmation(id: string): boolean {
  return pending.has(id);
}
