/* ==================== UTILITY FUNCTIONS ==================== */

export function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

export function toHex(b, pad) { return b.toString(16).toUpperCase().padStart(pad || 2, '0'); }

export function ipToBytes(ip) { return ip.split('.').map(Number); }

export function generateMAC() {
  const m = [];
  for (let i = 0; i < 6; i++) m.push(Math.floor(Math.random() * 256));
  m[0] = m[0] & 0xFE; // unicast
  return m;
}

export function formatMAC(bytes) { return bytes.map(b => toHex(b)).join(':'); }

export function checksumPlaceholder(bytes) {
  let sum = 0;
  for (let i = 0; i < bytes.length; i += 2) {
    sum += (bytes[i] << 8) | (bytes[i + 1] || 0);
  }
  while (sum >> 16) sum = (sum & 0xFFFF) + (sum >> 16);
  const cs = (~sum) & 0xFFFF;
  return [(cs >> 8) & 0xFF, cs & 0xFF];
}

export function formatSpeed(mbps) {
  if (mbps >= 1000) return (mbps / 1000).toFixed(mbps >= 10000 ? 0 : 1) + ' \u0413\u0431\u0438\u0442/\u0441';
  return Math.round(mbps) + ' \u041C\u0431\u0438\u0442/\u0441';
}

export function formatDist(m) {
  if (m >= 1000) return (m / 1000).toFixed(m >= 10000 ? 0 : 1) + ' \u043A\u043C';
  return m + ' \u043C';
}
