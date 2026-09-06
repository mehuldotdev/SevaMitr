import { CognitiveSessionRecord } from './offlineDb';

// Global singleton in Node runtime to prevent hot-reload memory clearing
const globalForServerStore = globalThis as unknown as {
  serverSessionMap: Map<string, CognitiveSessionRecord[]> | undefined;
  serverPatientMap: Map<string, any> | undefined;
};

const sessionMap = globalForServerStore.serverSessionMap ?? new Map<string, CognitiveSessionRecord[]>();
const patientMap = globalForServerStore.serverPatientMap ?? new Map<string, any>();

if (process.env.NODE_ENV !== 'production') {
  globalForServerStore.serverSessionMap = sessionMap;
  globalForServerStore.serverPatientMap = patientMap;
}

export const serverSessionStore = {
  addSessions(patientId: string, sessions: any[]) {
    const existing = sessionMap.get(patientId) || [];
    const formatted: CognitiveSessionRecord[] = sessions.map((s) => ({
      id: s.id || `sess_srv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      patientId: patientId || 'patient-ner-001',
      gameId: s.gameId,
      gameTitle: s.gameTitle || s.gameId,
      difficultyLevel: s.difficultyLevel || 1,
      score: s.score || 0,
      durationSec: s.durationSec || 60,
      hesitationMs: s.hesitationMs || 1500,
      errorCount: s.errorCount || 0,
      confusionLoops: s.confusionLoops || 0,
      completed: s.completed ?? true,
      timeOfDay: s.timeOfDay || 'morning',
      timestamp: s.timestamp || Date.now(),
      synced: true,
    }));

    sessionMap.set(patientId, [...formatted, ...existing]);
  },

  getSessions(patientId: string): CognitiveSessionRecord[] {
    return sessionMap.get(patientId) || [];
  },

  getAllSessions(): CognitiveSessionRecord[] {
    const all: CognitiveSessionRecord[] = [];
    Array.from(sessionMap.values()).forEach((list) => {
      all.push(...list);
    });
    return all;
  },

  savePatient(patient: any) {
    if (patient && patient.id) {
      patientMap.set(patient.id, patient);
    }
  },

  getPatient(id: string) {
    return patientMap.get(id);
  },

  getAllPatients() {
    return Array.from(patientMap.values());
  },

  getPatientsByCaregiver(caregiverId: string) {
    const all = Array.from(patientMap.values());
    const cleanDigits = caregiverId.replace(/[^0-9]/g, '');
    return all.filter((p) => {
      if (p.caregiverId === caregiverId) return true;
      if (p.caregiverPhone?.includes(caregiverId)) return true;
      if (cleanDigits.length >= 6 && p.caregiverPhone?.replace(/[^0-9]/g, '').includes(cleanDigits)) return true;
      if (cleanDigits.length >= 6 && p.caregiverId?.includes(cleanDigits)) return true;
      return false;
    });
  },

  deletePatient(id: string) {
    patientMap.delete(id);
    sessionMap.delete(id);
  },
};
