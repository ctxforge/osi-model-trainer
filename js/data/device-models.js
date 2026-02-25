// Real-world device model catalog for topology builder
export const DEVICE_MODELS = {
  switch_l2: [
    {
      id: 'cisco_2960', name: 'Cisco Catalyst 2960-X', ports: 24, speed: '1G',
      features: ['VLAN', '802.1Q', 'STP/RSTP', 'Port Security', 'QoS', 'SNMP'],
      desc: 'Управляемый L2-коммутатор для корпоративного доступа. Поддержка PoE.'
    },
    {
      id: 'mikrotik_css326', name: 'MikroTik CSS326-24G', ports: 24, speed: '1G',
      features: ['VLAN', '802.1Q', 'STP', 'Mirror', 'IGMP Snooping'],
      desc: 'Недорогой управляемый коммутатор с SwOS.'
    },
    {
      id: 'tp_sg108e', name: 'TP-Link TL-SG108E', ports: 8, speed: '1G',
      features: ['VLAN (802.1Q)', 'QoS', 'Bandwidth Control'],
      desc: 'Простой управляемый коммутатор для SOHO.'
    },
    {
      id: 'hp_2920', name: 'HP Aruba 2920-24G', ports: 24, speed: '1G',
      features: ['VLAN', 'STP', 'RSTP', 'MSTP', 'LLDP', 'SNMP', 'QoS'],
      desc: 'Управляемый коммутатор для корпоративной сети.'
    },
  ],
  switch_l3: [
    {
      id: 'cisco_3750', name: 'Cisco Catalyst 3750-X', ports: 24, speed: '1G',
      features: ['VLAN', 'OSPF', 'EIGRP', 'PIM', 'HSRP', 'QoS', 'ACL'],
      desc: 'L3-коммутатор с маршрутизацией между VLAN.'
    },
    {
      id: 'mikrotik_crs326', name: 'MikroTik CRS326-24G', ports: 24, speed: '1G',
      features: ['VLAN', 'OSPF', 'BGP', 'MPLS', 'RouterOS'],
      desc: 'Гибкий L3-коммутатор с полным RouterOS.'
    },
  ],
  router: [
    {
      id: 'cisco_isr4331', name: 'Cisco ISR 4331', ports: 3, speed: '1G',
      features: ['OSPF', 'BGP', 'EIGRP', 'NAT', 'ACL', 'VPN', 'QoS', 'SD-WAN'],
      desc: 'Корпоративный маршрутизатор с поддержкой сервисных модулей.'
    },
    {
      id: 'mikrotik_hex', name: 'MikroTik hEX (RB750Gr3)', ports: 5, speed: '1G',
      features: ['OSPF', 'BGP', 'NAT', 'Firewall', 'MPLS', 'Tunnels'],
      desc: 'Мощный компактный роутер для SOHO и малого бизнеса.'
    },
    {
      id: 'ubnt_er4', name: 'Ubiquiti EdgeRouter 4', ports: 4, speed: '1G',
      features: ['OSPF', 'BGP', 'NAT', 'Firewall', 'VLAN', 'QoS'],
      desc: 'Производительный маршрутизатор с Linux-ядром (EdgeOS).'
    },
    {
      id: 'cisco_asr1001', name: 'Cisco ASR 1001-X', ports: 8, speed: '10G',
      features: ['OSPF', 'BGP', 'MPLS', 'NAT', 'VPN', 'QoS', 'SD-WAN'],
      desc: 'Операторский маршрутизатор для WAN/Edge.'
    },
  ],
  ap: [
    {
      id: 'ubnt_uap_pro', name: 'Ubiquiti UAP-AC-Pro', ports: 2, speed: '1.75G',
      features: ['802.11ac', 'MIMO 3×3', '5+2.4 ГГц', 'VLAN', 'Band Steering'],
      desc: 'Профессиональная потолочная точка доступа для офиса.'
    },
    {
      id: 'cisco_air2702', name: 'Cisco Aironet 2702', ports: 2, speed: '1.3G',
      features: ['802.11ac', '4×4 MIMO', 'CleanAir', 'BandSelect'],
      desc: 'Корпоративная точка доступа с поддержкой CleanAir.'
    },
    {
      id: 'tp_eap670', name: 'TP-Link EAP670 (Wi-Fi 6)', ports: 1, speed: '5.4G',
      features: ['802.11ax', 'OFDMA', 'MU-MIMO', '5+2.4 ГГц', 'PoE'],
      desc: 'Потолочная точка доступа Wi-Fi 6 для плотных сред.'
    },
  ],
  firewall: [
    {
      id: 'cisco_asa5506', name: 'Cisco ASA 5506-X', ports: 8, speed: '1G',
      features: ['Stateful FW', 'NAT', 'VPN', 'IPS', 'URL Filtering', 'AVC'],
      desc: 'Аппаратный межсетевой экран с IPS для малого бизнеса.'
    },
    {
      id: 'pfsense', name: 'pfSense CE', ports: 'varies', speed: 'varies',
      features: ['Stateful FW', 'NAT', 'VPN', 'IDS/IPS', 'HAProxy', 'VLAN'],
      desc: 'Программный MЭ/маршрутизатор на FreeBSD. Бесплатный.'
    },
  ],
  pc: [
    { id: 'generic_pc', name: 'Рабочая станция', ports: 1, speed: '1G', features: ['TCP/IP'], desc: 'Обычный ПК.' },
  ],
  server: [
    {
      id: 'hp_dl380', name: 'HP ProLiant DL380', ports: 4, speed: '10G',
      features: ['IPMI', 'RAID', 'Hot-swap', 'VLAN'],
      desc: '2U стоечный сервер корпоративного класса.'
    },
  ],
};

export function getModelsForType(type) {
  return DEVICE_MODELS[type] || [];
}
