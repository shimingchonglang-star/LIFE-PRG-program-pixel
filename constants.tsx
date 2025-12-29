
import { Quest, Translations, Language } from './types';

export const INITIAL_QUESTS: Quest[] = [
  {
    id: 'stay-up-late',
    title: 'STAY UP LATE',
    hpImpact: -1,
    hungerImpact: 0,
    icon: '🌙',
    isCustom: false
  },
  {
    id: 'eat-well',
    title: 'EAT WELL',
    hpImpact: 2,
    hungerImpact: 2,
    icon: '🍗',
    isCustom: false
  },
  {
    id: 'workout',
    title: 'EXERCISE',
    hpImpact: 1,
    hungerImpact: -2,
    icon: '🏃',
    isCustom: false
  },
  {
    id: 'reading',
    title: 'READ 30 MIN',
    hpImpact: 0,
    hungerImpact: -1,
    icon: '📖',
    isCustom: false
  }
];

export const MAX_STATS = 10;

export const TRANSLATIONS: Record<Language, Translations> = {
  en: {
    home: 'HOME',
    calendar: 'HISTORY',
    settings: 'CONFIG',
    health: 'HEALTH',
    hunger: 'ENERGY',
    oracle: 'THE ORACLE SAYS',
    // English translation for quests
    quests: 'DAILY QUESTS',
    systemLogs: 'SYSTEM MESSAGES',
    done: 'DONE',
    edit: 'EDIT',
    delete: 'DEL',
    addQuest: 'NEW QUEST',
    language: 'LANGUAGE',
    history: 'JOURNEY LOG',
    save: 'SAVE',
    cancel: 'CANCEL',
    fontSize: 'FONT SIZE',
    sound: 'SOUND FX',
    on: 'ON',
    off: 'OFF',
    reorder: 'MOVE',
    prevMonth: 'PREV',
    nextMonth: 'NEXT'
  },
  cn: {
    home: '主页',
    calendar: '日历',
    settings: '设置',
    health: '生命',
    hunger: '饱食',
    oracle: '神谕说',
    // Chinese translation for quests
    quests: '每日任务',
    systemLogs: '系统日志',
    done: '完成',
    edit: '编辑',
    delete: '删除',
    addQuest: '新增任务',
    language: '语言',
    history: '冒险记录',
    save: '保存',
    cancel: '取消',
    fontSize: '字体大小',
    sound: '音效',
    on: '开',
    off: '关',
    reorder: '排序',
    prevMonth: '上月',
    nextMonth: '下月'
  },
  fr: {
    home: 'ACCUEIL',
    calendar: 'CALENDRIER',
    settings: 'CONFIG',
    health: 'SANTÉ',
    hunger: 'ÉNERGIE',
    oracle: 'L\'ORACLE DIT',
    // French translation for quests
    quests: 'QUÊTES',
    systemLogs: 'MESSAGES SYSTÈME',
    done: 'FAIT',
    edit: 'EDIT',
    delete: 'SUPPR',
    addQuest: 'NOUVELLE',
    language: 'LANGUE',
    history: 'JOURNAL',
    save: 'SAUVER',
    cancel: 'ANNULER',
    fontSize: 'TAILLE POLICE',
    sound: 'SONS',
    on: 'OUI',
    off: 'NON',
    reorder: 'TRIER',
    prevMonth: 'PRÉC',
    nextMonth: 'SUIV'
  }
};
