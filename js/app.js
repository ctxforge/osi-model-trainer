import { initGamification } from './core/gamification.js';
import { initTheme } from './core/theme.js';
import { initRouter } from './core/router.js';
import { initLabData } from './core/lab-data.js';
import { buildTower } from './sections/osi-tower.js';
import { initStudy } from './sections/study.js';
import { initSimulator } from './sections/simulator.js';
import { initLabEngine } from './sections/lab-engine.js';
import { initPhysicsLab } from './sections/physics-lab.js';
import { initDnD } from './sections/dragdrop.js';
import { initTerminal } from './sections/terminal.js';

// Init order matches original IIFE execution
initGamification();
initTheme();
initRouter();
buildTower('homeTower');
initStudy();
initSimulator();
initLabData();
initLabEngine();
initPhysicsLab();
initDnD();
initTerminal();
