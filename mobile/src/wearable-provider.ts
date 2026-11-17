// Vendor-agnostic interface for the wearable band, so the rest of the app
// (and a future second vendor) never depends on which BLE chipset/protocol
// won the comparison. The shapes below mirror what
// src/app/api/wearable/sync/route.ts expects — keep them in sync if that
// endpoint's payload changes.

export interface WearableDeviceInfo {
  deviceId: string;
  modello?: string;
  produttore?: string;
}

export interface DailyActivity {
  data: string; // YYYY-MM-DD
  passi?: number;
  distanzaKm?: number;
  calorieTotali?: number;
  calorieAttive?: number;
}

export interface WorkoutSession {
  sportType?: string;
  inizio: string; // ISO timestamp
  fine?: string;
  durataMinuti?: number;
  passi?: number;
  distanzaKm?: number;
  calorie?: number;
  frequenzaCardiacaMedia?: number;
}

export interface WearableProvider {
  scan(): Promise<WearableDeviceInfo[]>;
  connect(deviceId: string): Promise<void>;
  disconnect(): Promise<void>;
  readActivity(sinceDate: string): Promise<DailyActivity[]>;
  readSessions(sinceDate: string): Promise<WorkoutSession[]>;
}

// Staranb/Joint Corp implementation — BLOCKED on the vendor SDK (service
// and characteristic UUIDs, command/packet format are not public). Every
// method here is a placeholder until that SDK arrives; nothing else in the
// app depends on this file's internals, only on the WearableProvider shape
// above, so filling these in is an isolated, self-contained task.
export class StaranbProvider implements WearableProvider {
  async scan(): Promise<WearableDeviceInfo[]> {
    throw new Error("SDK Staranb non ancora disponibile — in attesa del fornitore.");
  }

  async connect(_deviceId: string): Promise<void> {
    throw new Error("SDK Staranb non ancora disponibile — in attesa del fornitore.");
  }

  async disconnect(): Promise<void> {
    throw new Error("SDK Staranb non ancora disponibile — in attesa del fornitore.");
  }

  async readActivity(_sinceDate: string): Promise<DailyActivity[]> {
    throw new Error("SDK Staranb non ancora disponibile — in attesa del fornitore.");
  }

  async readSessions(_sinceDate: string): Promise<WorkoutSession[]> {
    throw new Error("SDK Staranb non ancora disponibile — in attesa del fornitore.");
  }
}
