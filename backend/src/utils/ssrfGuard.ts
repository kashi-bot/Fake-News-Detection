import dns from 'node:dns/promises';
import net from 'node:net';
import { ApiError } from './ApiError';

const BLOCKED_V4 = [
  /^0\./, /^10\./, /^127\./, /^169\.254\./, /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.0\.0\./, /^192\.168\./, /^198\.(18|19)\./, /^22[4-9]\./, /^23\d\./, /^24\d\./, /^255\./,
];

function isPrivateAddress(addr: string): boolean {
  if (net.isIPv4(addr)) return BLOCKED_V4.some(r => r.test(addr));
  if (net.isIPv6(addr)) {
    const a = addr.toLowerCase();
    return a === '::1' || a === '::' || a.startsWith('fc') || a.startsWith('fd') || a.startsWith('fe80') || a.startsWith('::ffff:');
  }
  return true;
}

/** Resolves a hostname and rejects anything pointing at internal infrastructure. */
export async function assertPublicUrl(rawUrl: string): Promise<void> {
  const url = new URL(rawUrl);
  const host = url.hostname;

  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal') || host.endsWith('.local')) {
    throw new ApiError(400, 'BLOCKED_HOST', 'That host is not allowed.');
  }

  // Literal IP in the URL
  if (net.isIP(host)) {
    if (isPrivateAddress(host)) throw new ApiError(400, 'BLOCKED_HOST', 'That address is not allowed.');
    return;
  }

  let records: { address: string }[];
  try {
    records = await dns.lookup(host, { all: true, verbatim: true });
  } catch {
    throw new ApiError(400, 'DNS_FAILED', 'That hostname could not be resolved.');
  }
  if (!records.length) throw new ApiError(400, 'DNS_FAILED', 'That hostname could not be resolved.');
  for (const r of records) {
    if (isPrivateAddress(r.address)) {
      throw new ApiError(400, 'BLOCKED_HOST', 'That host resolves to a private network address and is not allowed.');
    }
  }
}