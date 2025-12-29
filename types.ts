
export type Language = 'en' | 'cn' | 'fr';
export type FontSize = 'small' | 'medium' | 'large';

export interface Quest {
  id: string;
  title: string;
  hpImpact: number;
  hungerImpact: number;
  xpImpact?: number; // Added XP impact
  icon: string;
  isCustom?: boolean;
}

export interface PlayerStats {
  health: number;
  hunger: number;
  experience: number;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  hp: number;
  hunger: number;
  xp: number; // Added XP to history
}

export interface GameLog {
  id: string;
  timestamp: number;
  message: string;
  impact: string;
}

export interface UserSettings {
  language: Language;
  fontSize: FontSize;
  sfxEnabled: boolean;
}

export interface Translations {
  home: string;
  calendar: string;
  settings: string;
  health: string;
  hunger: string;
  xp: string;
  oracle: string;
  quests: string;
  systemLogs: string;
  done: string;
  edit: string;
  delete: string;
  addQuest: string;
  language: string;
  history: string;
  save: string;
  cancel: string;
  fontSize: string;
  sound: string;
  on: string;
  off: string;
  reorder: string;
  prevMonth: string;
  nextMonth: string;
  status: string;
  summary: string;
}
