// Guided Lab Engine — step-by-step lab workflow
import { GUIDED_LABS } from '../data/guided-labs.js';
import { addXP } from './gamification.js';

export const engineState = {
  activeLab: null,
  currentStep: 0,
  startTime: 0,
  answers: {},       // stepId → answer index
  completed: [],     // completed lab IDs
};

let onStepChange = null;
let topologyStateGetter = null;
let instrumentStateGetter = null;

export function registerTopologyStateGetter(fn) { topologyStateGetter = fn; }
export function registerInstrumentStateGetter(fn) { instrumentStateGetter = fn; }
export function onStepChanged(fn) { onStepChange = fn; }

export function startLab(labId) {
  const lab = GUIDED_LABS.find(l => l.id === labId);
  if (!lab) return;
  engineState.activeLab = labId;
  engineState.currentStep = 0;
  engineState.startTime = Date.now();
  engineState.answers = {};
  if (onStepChange) onStepChange(lab, 0);
}

export function getActiveLab() {
  return engineState.activeLab ? GUIDED_LABS.find(l => l.id === engineState.activeLab) : null;
}

export function getCurrentStep() {
  const lab = getActiveLab();
  if (!lab) return null;
  return lab.steps[engineState.currentStep] || null;
}

export function answerQuestion(stepId, answerIdx) {
  engineState.answers[stepId] = answerIdx;
  const step = getCurrentStep();
  if (!step) return false;
  const correct = step.answers && step.answers[answerIdx]?.correct;
  if (correct) addXP(10);
  return correct;
}

export function advanceStep() {
  const lab = getActiveLab();
  if (!lab) return;
  const nextStep = engineState.currentStep + 1;
  if (nextStep >= lab.steps.length) {
    // Lab complete!
    if (!engineState.completed.includes(lab.id)) {
      engineState.completed.push(lab.id);
      addXP(50);
    }
    engineState.activeLab = null;
    if (onStepChange) onStepChange(null, 0);
    return 'completed';
  }
  engineState.currentStep = nextStep;
  if (onStepChange) onStepChange(lab, nextStep);
  return 'next';
}

export function checkStepAuto(step) {
  if (!step || !step.check) return null; // manual check
  switch (step.check) {
    case 'topology_has_switch_and_pcs': {
      if (!topologyStateGetter) return false;
      const state = topologyStateGetter();
      const hasSwitch = state.devices?.some(d => d.type?.startsWith('switch'));
      const pcCount = state.devices?.filter(d => d.type === 'pc').length || 0;
      return hasSwitch && pcCount >= 4;
    }
    case 'devices_have_ip': {
      if (!topologyStateGetter) return false;
      const state = topologyStateGetter();
      const withIp = state.devices?.filter(d => d.ip && d.ip.length > 0).length || 0;
      return withIp >= 3;
    }
    case 'traffic_started': {
      return true; // Accept if user clicked
    }
    case 'question_answered': {
      return step.id in engineState.answers;
    }
    default: return false;
  }
}

export function getElapsedMinutes() {
  if (!engineState.startTime) return 0;
  return Math.round((Date.now() - engineState.startTime) / 60000);
}
