/**
 * Offline-First Local Data Store
 * Stores game sessions, telemetry metrics, and reminders locally in the browser.
 * Works 100% offline without any internet connection.
 */

export interface CognitiveSessionRecord {
  id: string;
  patientId: string;
  gameId: 'smriti_setu' | 'doharani' | 'rang_tanti' | 'shabda_tarang' | 'bazaar_saathi' | 'double_decision' | 'sound_sweeps' | 'target_tracker' | 'speed_maze' | 'bijuli_tap' | 'bikhama_khoj' | string;
  gameTitle: string;
  difficultyLevel: number;
  score: number;
  durationSec: number;
  hesitationMs: number; // Average response delay
  errorCount: number;
  confusionLoops: number;
  completed: boolean;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  timestamp: number;
  synced: boolean;
}

export interface ReminderItem {
  id: string;
  patientId: string;
  type: 'medicine' | 'hydration' | 'routine' | 'appointment';
  title: string;
  titleAssamese: string;
  titleBengali: string;
  titleHindi?: string;
  timeSlot: string; // "08:00 AM"
  completed: boolean;
  iconName: string;
}

export interface PatientProfile {
  id: string;
  fullName: string;
  age: number;
  gender: string;
  region: string;
  primaryLanguage: 'as' | 'bn' | 'hi' | 'en';
  dementiaStage: 'MCI' | 'Mild' | 'Moderate';
  emergencyContact: string;
  caregiverName: string;
  caregiverPhone: string;
}

const STORAGE_KEYS = {
  SESSIONS: 'sevamitr_offline_sessions_v1',
  REMINDERS: 'sevamitr_offline_reminders_v1',
  PATIENT: 'sevamitr_offline_patient_v1',
  SYNC_QUEUE: 'sevamitr_offline_sync_queue_v1',
};

// Initial default demo patient rooted in Assam / NER
export const DEFAULT_PATIENT: PatientProfile = {
  id: '56ce0682-87de-4210-8229-b6a216395dd1',
  fullName: 'Mridula Hazarika',
  age: 72,
  gender: 'Female',
  region: 'Tezpur, Assam',
  primaryLanguage: 'en',
  dementiaStage: 'Mild',
  emergencyContact: '9846198473',
  caregiverName: 'Anuradha Baruah',
  caregiverPhone: '9846198473',
};

export const DEFAULT_REMINDERS: ReminderItem[] = [
  {
    id: 'rem-1',
    patientId: 'patient-ner-001',
    type: 'routine',
    title: 'Morning Warm Tea & Biscuit',
    titleAssamese: 'পুৱাৰ ৰঙা চাহ আৰু বিস্কুট',
    titleBengali: 'সকালের লাল চা ও বিস্কুট',
    titleHindi: 'सुबह की चाय और बिस्कुट',
    timeSlot: '07:30 AM',
    completed: true,
    iconName: 'Coffee',
  },
  {
    id: 'rem-2',
    patientId: 'patient-ner-001',
    type: 'medicine',
    title: 'Morning Blood Pressure Medicine (Amlodipine 5mg)',
    titleAssamese: 'পুৱাৰ প্ৰেছাৰৰ ঔষধ (এমল’ডিপাইন)',
    titleBengali: 'সকালের প্রেসারের ওষুধ',
    titleHindi: 'सुबह की बीपी की दवाई',
    timeSlot: '08:30 AM',
    completed: false,
    iconName: 'Pill',
  },
  {
    id: 'rem-3',
    patientId: 'patient-ner-001',
    type: 'hydration',
    title: 'Drink 1 Glass of Fresh Water',
    titleAssamese: 'এগিলাচ বিশুদ্ধ পানী খাব লাগে',
    titleBengali: 'এক গ্লাস জল পান করুন',
    titleHindi: 'एक गिलास ताजा पानी पिएं',
    timeSlot: '11:00 AM',
    completed: false,
    iconName: 'Droplets',
  },
  {
    id: 'rem-4',
    patientId: 'patient-ner-001',
    type: 'routine',
    title: 'Afternoon Rest & Quiet Prayer',
    titleAssamese: 'দুপৰীয়া অলপ জিৰণি আৰু প্ৰাৰ্থনা',
    titleBengali: 'দুপুরে একটু বিশ্রাম ও প্রার্থনা',
    titleHindi: 'दोपहर का विश्राम और प्रार्थना',
    timeSlot: '04:00 PM',
    completed: false,
    iconName: 'Sun',
  },
  {
    id: 'rem-5',
    patientId: 'patient-ner-001',
    type: 'medicine',
    title: 'Night Memory & Sleep Supplement',
    titleAssamese: 'ৰাতিৰ ঔষধ আৰু টোপনিৰ সাহায্য',
    titleBengali: 'রাতের ওষুধ ও ঘুমের সাহায্য',
    titleHindi: 'रात की दवाई और शांतिपूर्ण नींद',
    timeSlot: '09:00 PM',
    completed: false,
    iconName: 'Moon',
  },
];

class OfflineStorageEngine {
  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  // Patient Profile
  getPatient(): PatientProfile;
  getPatient(caregiverId: string): PatientProfile | null;
  getPatient(caregiverId?: string): PatientProfile | null {
    if (!this.isBrowser()) return (!caregiverId || caregiverId === 'demo-caregiver-001') ? DEFAULT_PATIENT : null;
    try {
      if (caregiverId) {
        const scoped = localStorage.getItem(`${STORAGE_KEYS.PATIENT}_${caregiverId}`);
        if (scoped) return JSON.parse(scoped);
        return caregiverId === 'demo-caregiver-001' ? DEFAULT_PATIENT : null;
      }
      const stored = localStorage.getItem(STORAGE_KEYS.PATIENT);
      return stored ? JSON.parse(stored) : DEFAULT_PATIENT;
    } catch {
      return (!caregiverId || caregiverId === 'demo-caregiver-001') ? DEFAULT_PATIENT : null;
    }
  }

  savePatient(patient: PatientProfile, caregiverId?: string) {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(STORAGE_KEYS.PATIENT, JSON.stringify(patient));
      if (caregiverId) {
        localStorage.setItem(`${STORAGE_KEYS.PATIENT}_${caregiverId}`, JSON.stringify(patient));
      }
    } catch (e) {
      console.error('Failed to save patient', e);
    }
  }

  hasPatient(caregiverId?: string): boolean {
    if (!caregiverId || caregiverId === 'demo-caregiver-001') return true;
    if (!this.isBrowser()) return false;
    try {
      const scoped = localStorage.getItem(`${STORAGE_KEYS.PATIENT}_${caregiverId}`);
      if (scoped) return true;
      const cached = localStorage.getItem(`sevamitr_cached_patients_${caregiverId}`);
      if (cached) {
        const list = JSON.parse(cached);
        if (Array.isArray(list) && list.length > 0) return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  deletePatient(patientId: string, caregiverId?: string): void {
    if (!this.isBrowser()) return;
    try {
      if (caregiverId) {
        localStorage.removeItem(`${STORAGE_KEYS.PATIENT}_${caregiverId}`);
        const cached = localStorage.getItem(`sevamitr_cached_patients_${caregiverId}`);
        if (cached) {
          const list = JSON.parse(cached);
          if (Array.isArray(list)) {
            const updated = list.filter((p: PatientProfile) => p.id !== patientId);
            localStorage.setItem(`sevamitr_cached_patients_${caregiverId}`, JSON.stringify(updated));
            if (updated.length > 0) {
              localStorage.setItem(`${STORAGE_KEYS.PATIENT}_${caregiverId}`, JSON.stringify(updated[0]));
              localStorage.setItem(STORAGE_KEYS.PATIENT, JSON.stringify(updated[0]));
            } else {
              localStorage.removeItem(STORAGE_KEYS.PATIENT);
            }
          }
        }
      }
      const stored = localStorage.getItem(STORAGE_KEYS.PATIENT);
      if (stored) {
        const p = JSON.parse(stored);
        if (p.id === patientId) {
          localStorage.removeItem(STORAGE_KEYS.PATIENT);
        }
      }
    } catch (e) {
      console.error('Failed to delete patient locally', e);
    }
  }

  // Sessions
  getSessions(patientId?: string): CognitiveSessionRecord[] {
    if (!this.isBrowser()) return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      let list: CognitiveSessionRecord[] = [];
      if (!stored) {
        // Seed initial 7-day realistic progression for Bhaben Baruah demo ONLY
        const initial = this.generateHistoricalSeed();
        this.saveAllSessions(initial);
        list = initial;
      } else {
        list = JSON.parse(stored);
      }

      if (patientId) {
        const filtered = list.filter((s) => s.patientId === patientId);
        if (filtered.length > 0) return filtered;
        // Fallback: If sessions were recorded under another/default ID, return list so progress is preserved
        return list;
      }
      return list;
    } catch {
      return [];
    }
  }

  saveSession(session: Omit<CognitiveSessionRecord, 'id' | 'timestamp' | 'synced'>): CognitiveSessionRecord {
    const fullSession: CognitiveSessionRecord = {
      ...session,
      id: 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      timestamp: Date.now(),
      synced: false,
    };

    if (this.isBrowser()) {
      try {
        const sessions = this.getSessions();
        sessions.unshift(fullSession);
        this.saveAllSessions(sessions);

        // Automatic background sync to SQLite database
        const patient = this.getPatient();
        fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: patient?.id || 'patient-ner-001',
            sessions: [fullSession],
            timestamp: Date.now(),
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              fullSession.synced = true;
              const all = this.getSessions().map((s) =>
                s.id === fullSession.id ? { ...s, synced: true } : s
              );
              this.saveAllSessions(all);
            }
          })
          .catch(() => {
            // Offline - will sync when online
          });
      } catch (e) {
        console.error('Failed to save session locally', e);
      }
    }
    return fullSession;
  }

  saveAllSessions(sessions: CognitiveSessionRecord[]) {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.error('Error writing sessions', e);
    }
  }

  getUnsyncedCount(): number {
    return this.getSessions().filter(s => !s.synced).length;
  }

  markAllSynced() {
    if (!this.isBrowser()) return;
    const sessions = this.getSessions().map(s => ({ ...s, synced: true }));
    this.saveAllSessions(sessions);
  }

  // Reminders
  getReminders(): ReminderItem[] {
    if (!this.isBrowser()) return DEFAULT_REMINDERS;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.REMINDERS);
      return stored ? JSON.parse(stored) : DEFAULT_REMINDERS;
    } catch {
      return DEFAULT_REMINDERS;
    }
  }

  toggleReminder(id: string): ReminderItem[] {
    if (!this.isBrowser()) return DEFAULT_REMINDERS;
    const reminders = this.getReminders().map(r => 
      r.id === id ? { ...r, completed: !r.completed } : r
    );
    try {
      localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
    } catch (e) {
      console.error('Error saving reminders', e);
    }
    return reminders;
  }

  // Seed sample data for 7-day realistic clinical demo
  private generateHistoricalSeed(): CognitiveSessionRecord[] {
    const games: ('smriti_setu' | 'doharani' | 'rang_tanti' | 'shabda_tarang' | 'bazaar_saathi')[] = [
      'smriti_setu', 'doharani', 'rang_tanti', 'shabda_tarang', 'bazaar_saathi'
    ];
    const titles = {
      smriti_setu: 'Smriti Setu (Memory Bridge)',
      doharani: 'Doharani (Daily Routine Recall)',
      rang_tanti: 'Rang & Tanti (Weave Attention)',
      shabda_tarang: 'Shabda Tarang (Sound Memory)',
      bazaar_saathi: 'Bazaar Saathi (Haat Market Math)',
    };

    const records: CognitiveSessionRecord[] = [];
    const now = Date.now();

    for (let day = 6; day >= 1; day--) {
      const dayTimestamp = now - day * 86400000;
      // Morning session (usually sharp performance)
      records.push({
        id: `seed_m_${day}`,
        patientId: 'patient-ner-001',
        gameId: games[day % 5],
        gameTitle: titles[games[day % 5]],
        difficultyLevel: 2,
        score: Math.floor(75 + Math.random() * 20),
        durationSec: 85,
        hesitationMs: 1400 + Math.random() * 400,
        errorCount: Math.floor(Math.random() * 2),
        confusionLoops: 0,
        completed: true,
        timeOfDay: 'morning',
        timestamp: dayTimestamp + 9 * 3600000,
        synced: true,
      });

      // Evening session (shows subtle sun-downing latency increase)
      records.push({
        id: `seed_e_${day}`,
        patientId: 'patient-ner-001',
        gameId: games[(day + 2) % 5],
        gameTitle: titles[games[(day + 2) % 5]],
        difficultyLevel: 2,
        score: Math.floor(60 + Math.random() * 18),
        durationSec: 130,
        hesitationMs: 2400 + Math.random() * 800, // Higher hesitation in evening (circadian drop)
        errorCount: Math.floor(2 + Math.random() * 3),
        confusionLoops: 1,
        completed: true,
        timeOfDay: 'evening',
        timestamp: dayTimestamp + 18 * 3600000,
        synced: true,
      });
    }

    return records;
  }
}

export const offlineDb = new OfflineStorageEngine();
