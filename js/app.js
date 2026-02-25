import { initTooltips } from './core/tooltips.js';
import { initGamification } from './core/gamification.js';
import { initTheme } from './core/theme.js';
import { initRouter } from './core/router.js';
import { initLabData } from './core/lab-data.js';
import { buildTower } from './sections/osi-tower.js';
import { initHome } from './sections/home.js';
import { initTheory } from './theory/theory-engine.js';
import { initStudy } from './sections/study.js';
import { initSimulator } from './sections/simulator.js';
import { initLabEngine } from './sections/lab-engine.js';
import { initPhysicsLab } from './sections/physics-lab.js';
import { initProtocols } from './sections/protocols.js';
import { initDnD } from './sections/dragdrop.js';
import { initTerminal } from './sections/terminal.js';
import { initCampaign } from './sections/campaign.js';
import { initSignalGenerator } from './labs/signal-generator.js';
import { initSpectrumAnalyzer } from './labs/spectrum-analyzer.js';
import { initSignalChain } from './labs/signal-chain.js';
import { initNetworkInstruments } from './labs/network-instruments.js';
import { initUnitsRef } from './sections/units-ref.js';
import { initRadioLab } from './labs/radio-lab.js';
import { initGuidedLabs } from './sections/guided-labs.js';
import { registerTopologyStateGetter } from './core/guided-lab-engine.js';
import { getTopologyState } from './labs/topology-builder.js';

// Init order matches original IIFE execution
initTooltips();
initGamification();
initTheme();
initRouter();
buildTower('homeTower');
initHome();
initTheory();
initStudy();
initSimulator();
initLabData();
initLabEngine();
initPhysicsLab();
initProtocols();
initDnD();
initTerminal();
initCampaign();

// Professional instruments (lazy init — activated when tab is opened)
initSignalGenerator();
initSpectrumAnalyzer();
initSignalChain();
initNetworkInstruments();

// New sections
initUnitsRef();
initRadioLab();
initGuidedLabs();

// Connect guided lab engine to topology builder
registerTopologyStateGetter(getTopologyState);
