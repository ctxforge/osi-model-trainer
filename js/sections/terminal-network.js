/* ==================== TERMINAL: Network Data & Helpers ==================== */
import { sleep } from '../core/utils.js';

export const SIM_NET = {
  hostname: 'osi-lab',
  ip: '192.168.1.100',
  mask: '255.255.255.0',
  gateway: '192.168.1.1',
  mac: 'AA:BB:CC:11:22:33',
  dns: '8.8.8.8',
  interfaces: [
    { name: 'eth0', ip: '192.168.1.100', mask: '255.255.255.0', mac: 'AA:BB:CC:11:22:33', status: 'UP', mtu: 1500, rx: 1547823, tx: 892341 },
    { name: 'wlan0', ip: '192.168.1.101', mask: '255.255.255.0', mac: 'DD:EE:FF:44:55:66', status: 'UP', mtu: 1500, rx: 328941, tx: 124567 },
    { name: 'lo', ip: '127.0.0.1', mask: '255.0.0.0', mac: '00:00:00:00:00:00', status: 'UP', mtu: 65536, rx: 45123, tx: 45123 }
  ],
  arp: [
    { ip: '192.168.1.1', mac: '00:1A:2B:3C:4D:5E', iface: 'eth0' },
    { ip: '192.168.1.50', mac: '11:22:33:AA:BB:CC', iface: 'eth0' },
    { ip: '192.168.1.200', mac: 'FF:EE:DD:CC:BB:AA', iface: 'wlan0' }
  ],
  connections: [
    { proto: 'tcp', local: '192.168.1.100:443', remote: '93.184.216.34:54321', state: 'ESTABLISHED' },
    { proto: 'tcp', local: '192.168.1.100:22', remote: '0.0.0.0:*', state: 'LISTEN' },
    { proto: 'tcp', local: '192.168.1.100:80', remote: '0.0.0.0:*', state: 'LISTEN' },
    { proto: 'tcp', local: '192.168.1.100:52341', remote: '142.250.74.78:443', state: 'ESTABLISHED' },
    { proto: 'udp', local: '192.168.1.100:53', remote: '0.0.0.0:*', state: '' },
    { proto: 'tcp', local: '192.168.1.100:49200', remote: '151.101.1.69:443', state: 'TIME_WAIT' }
  ],
  routes: [
    { dest: '0.0.0.0', mask: '0.0.0.0', gw: '192.168.1.1', iface: 'eth0', metric: 100 },
    { dest: '192.168.1.0', mask: '255.255.255.0', gw: '0.0.0.0', iface: 'eth0', metric: 0 },
    { dest: '127.0.0.0', mask: '255.0.0.0', gw: '0.0.0.0', iface: 'lo', metric: 0 }
  ],
  hosts: {
    'google.com': { ip: '142.250.74.78', hops: 8 },
    'example.com': { ip: '93.184.216.34', hops: 11 },
    'github.com': { ip: '140.82.121.4', hops: 9 },
    'ya.ru': { ip: '87.250.250.242', hops: 6 },
    'cloudflare.com': { ip: '104.16.132.229', hops: 5 },
    'localhost': { ip: '127.0.0.1', hops: 0 },
    '8.8.8.8': { ip: '8.8.8.8', hops: 7 }
  }
};

export function resolveHost(host) {
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return { ip: host, hops: 5 + Math.floor(Math.random() * 8) };
  return SIM_NET.hosts[host] || { ip: `${100 + Math.floor(Math.random()*55)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`, hops: 6 + Math.floor(Math.random() * 8) };
}

export function termLine(termOutput, text, cls) {
  const div = document.createElement('div');
  div.className = 'term-line' + (cls ? ' term-line--' + cls : '');
  div.innerHTML = text;
  termOutput.appendChild(div);
}

export function termScroll(termOutput) { termOutput.scrollTop = termOutput.scrollHeight; }
