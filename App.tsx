
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Background from './components/Background';
import StatusBar from './components/StatusBar';
import { PlayerStats, Quest, GameLog, Language, DailyStats, FontSize } from './types';
import { INITIAL_QUESTS, MAX_STATS, TRANSLATIONS } from './constants';
import { getDailyMotivation } from './services/geminiService';

const App: React.FC = () => {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'home' | 'calendar' | 'settings'>('home');
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('lang') as Language) || 'cn');
  const [fontSize, setFontSize] = useState<FontSize>(() => (localStorage.getItem('font_size') as FontSize) || 'medium');
  const [sfx, setSfx] = useState(true);
  
  const [stats, setStats] = useState<PlayerStats>(() => {
    const saved = localStorage.getItem('life_rpg_stats');
    return saved ? JSON.parse(saved) : { health: 8, hunger: 6, experience: 6 };
  });

  const [quests, setQuests] = useState<Quest[]>(() => {
    const saved = localStorage.getItem('life_rpg_quests');
    return saved ? JSON.parse(saved) : INITIAL_QUESTS;
  });

  const [history, setHistory] = useState<DailyStats[]>(() => {
    const saved = localStorage.getItem('life_rpg_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [logs, setLogs] = useState<GameLog[]>([]);
  const [motivation, setMotivation] = useState("Adventure awaits, traveler!");
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DailyStats | null>(null);
  const [isYearPicker, setIsYearPicker] = useState(false);
  const [clickEffect, setClickEffect] = useState<{id: string, x: number, y: number, text: string} | null>(null);

  const t = useMemo(() => TRANSLATIONS[lang], [lang]);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // --- PERSISTENCE ---
  useEffect(() => localStorage.setItem('life_rpg_stats', JSON.stringify(stats)), [stats]);
  useEffect(() => localStorage.setItem('life_rpg_quests', JSON.stringify(quests)), [quests]);
  useEffect(() => localStorage.setItem('life_rpg_history', JSON.stringify(history)), [history]);
  useEffect(() => localStorage.setItem('lang', lang), [lang]);
  useEffect(() => localStorage.setItem('font_size', fontSize), [fontSize]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setHistory(prev => {
      const existingIdx = prev.findIndex(h => h.date === today);
      const newEntry = { date: today, hp: stats.health, hunger: stats.hunger, xp: stats.experience };
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = newEntry;
        return next;
      }
      return [...prev, newEntry];
    });
  }, [stats.health, stats.hunger, stats.experience]);

  const fetchMotivation = useCallback(async () => {
    const msg = await getDailyMotivation(stats.health, stats.hunger);
    setMotivation(msg);
  }, [stats.health, stats.hunger]);

  useEffect(() => { fetchMotivation(); }, []);

  const hapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      const durations = { light: 10, medium: 30, heavy: 60 };
      navigator.vibrate(durations[type]);
    }
  };

  const playBeep = (freq = 440, duration = 0.08) => {
    if (!sfx) return;
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, audioCtxRef.current.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtxRef.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);
    osc.start();
    osc.stop(audioCtxRef.current.currentTime + duration);
  };

  const handleAction = (quest: Quest, e: React.MouseEvent) => {
    hapticFeedback('medium');
    playBeep(600 + (quest.hpImpact * 50));
    
    let effectText = "";
    if (quest.hpImpact !== 0) effectText += `${quest.hpImpact > 0 ? '+' : ''}${quest.hpImpact}HP `;
    if (quest.xpImpact && quest.xpImpact !== 0) effectText += `${quest.xpImpact > 0 ? '+' : ''}${quest.xpImpact}XP`;

    setClickEffect({ id: quest.id, x: e.clientX, y: e.clientY, text: effectText });
    setTimeout(() => setClickEffect(null), 600);

    setStats(prev => ({
      ...prev,
      health: Math.min(MAX_STATS, Math.max(0, prev.health + quest.hpImpact)),
      hunger: Math.min(MAX_STATS, Math.max(0, prev.hunger + quest.hungerImpact)),
      experience: Math.min(MAX_STATS, Math.max(0, prev.experience + (quest.xpImpact || 0) / 10))
    }));

    setLogs(prev => [{
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      message: `${quest.title}`,
      impact: `${quest.hpImpact >= 0 ? '+' : ''}${quest.hpImpact} HP`
    }, ...prev.slice(0, 3)]);
  };

  const saveQuest = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = isEditing && isEditing !== 'new' ? isEditing : Math.random().toString(36).substr(2, 9);
    const newQuest: Quest = {
      id,
      title: (formData.get('title') as string).toUpperCase(),
      icon: formData.get('icon') as string,
      hpImpact: parseInt(formData.get('hp') as string),
      hungerImpact: parseInt(formData.get('hunger') as string),
      xpImpact: parseInt(formData.get('xp') as string),
      isCustom: true
    };
    
    setQuests(prev => {
      if (isEditing && isEditing !== 'new') {
        return prev.map(q => q.id === isEditing ? newQuest : q);
      }
      return [...prev, newQuest];
    });
    setIsEditing(null);
    hapticFeedback('heavy');
    playBeep(800);
  };

  const moveQuest = (index: number, direction: 'up' | 'down') => {
    const newQuests = [...quests];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newQuests.length) return;
    [newQuests[index], newQuests[targetIndex]] = [newQuests[targetIndex], newQuests[index]];
    setQuests(newQuests);
    hapticFeedback('light');
    playBeep(400, 0.05);
  };

  const isCN = lang === 'cn';
  
  // Robust global font scaling
  const fontSizeClass = useMemo(() => {
    if (fontSize === 'small') return isCN ? 'text-[18px]' : 'text-[14px]';
    if (fontSize === 'large') return isCN ? 'text-[28px]' : 'text-[24px]';
    return isCN ? 'text-[22px]' : 'text-[18px]';
  }, [fontSize, isCN]);

  const labelFontClass = useMemo(() => {
    if (fontSize === 'small') return isCN ? 'text-[14px]' : 'text-[12px]';
    if (fontSize === 'large') return isCN ? 'text-[20px]' : 'text-[18px]';
    return isCN ? 'text-[16px]' : 'text-[14px]';
  }, [fontSize, isCN]);

  const getStatusAchievement = (hp: number, xp: number, f: number) => {
    const achievements = [];
    if (hp > 8) achievements.push(isCN ? "元气满满" : "Energetic");
    else if (hp < 3) achievements.push(isCN ? "极度疲劳" : "Exhausted");
    
    if (xp > 7) achievements.push(isCN ? "突飞猛进" : "Leaps & Bounds");
    else if (xp < 3) achievements.push(isCN ? "潜心修行" : "Meditation");

    if (f < 2) achievements.push(isCN ? "饥肠辘辘" : "Hungry");

    return achievements.length > 0 ? achievements.join(" • ") : (isCN ? "平稳发展" : "Stable");
  };

  const renderHome = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const dayName = today.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const isNight = today.getHours() < 8 || today.getHours() >= 18;

    return (
      <div className={fontSizeClass}>
        {/* Header */}
        <div className="bg-[#1a1a2e] text-white p-6 pixel-border border-white/10 mb-6 flex justify-between items-start">
          <div>
            <h1 className="pixel-font text-2xl tracking-widest mb-1 font-black">PIXEL LIFE</h1>
            <p className="pixel-font text-[14px] text-yellow-400 uppercase font-bold">{todayStr} {dayName}</p>
          </div>
          <div className="text-6xl">{isNight ? '🌙' : '☀️'}</div>
        </div>

        {/* Oracle Box */}
        <div className="px-4">
          <div className="bg-[#e5e5e5] p-6 pixel-border border-black mb-6 flex gap-6 items-center shadow-lg active:bg-gray-200 transition-colors" onClick={() => fetchMotivation()}>
            <div className="w-20 h-20 bg-white pixel-border border-black flex items-center justify-center text-5xl overflow-hidden shrink-0">🧙</div>
            <div className="flex-1 text-black">
              <p className={`pixel-font text-[11px] text-gray-500 mb-1 font-bold uppercase`}>{isCN ? '生存状态' : 'STATUS'} : {isCN ? '勇者' : 'TRAVELER'}</p>
              <p className="font-bold leading-tight text-[1.2em] pixel-font tracking-tight">{motivation}</p>
            </div>
          </div>

          <StatusBar health={stats.health} hunger={stats.hunger} experience={stats.experience} fontSize={fontSize} lang={lang} />

          {/* Action Area */}
          <div className="flex justify-between items-center mb-4 px-2">
            <h2 className={`pixel-font text-[0.8em] text-white font-black uppercase`}>{t.quests}</h2>
            <button onClick={() => { hapticFeedback(); setIsEditing('new'); }} className="text-yellow-400 pixel-font text-[0.7em] underline font-bold tracking-tighter">+{t.addQuest}</button>
          </div>

          {/* Strict 2x2 Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {quests.map((q, idx) => (
              <div key={q.id} className="relative aspect-square">
                <button 
                  onClick={(e) => handleAction(q, e)}
                  className="w-full h-full bg-white p-4 pixel-border border-black flex flex-col items-center justify-center space-y-2 active:scale-95 transition-transform shadow-xl overflow-hidden"
                >
                  <span className="text-5xl">{q.icon}</span>
                  <span className="pixel-font text-[0.8em] text-black font-black text-center leading-none">{q.title}</span>
                  <div className="flex flex-col items-center">
                    {q.hpImpact !== 0 && (
                      <span className={`pixel-font text-[0.6em] font-black ${q.hpImpact > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {q.hpImpact > 0 ? '+' : ''}{q.hpImpact} HP
                      </span>
                    )}
                    {q.xpImpact ? (
                      <span className="pixel-font text-[0.6em] font-black text-blue-500">+{q.xpImpact} XP</span>
                    ) : null}
                  </div>
                </button>
                
                {/* Control Icons Overlay */}
                <div className="absolute top-1 right-1 flex flex-col gap-1">
                  <button onClick={(e) => { e.stopPropagation(); hapticFeedback(); setIsEditing(q.id); }} className="w-8 h-8 bg-blue-500 text-white pixel-border border-black flex items-center justify-center text-xs shadow-md">✎</button>
                  <button onClick={(e) => { e.stopPropagation(); moveQuest(idx, 'up'); }} className="w-8 h-8 bg-gray-500 text-white pixel-border border-black flex items-center justify-center text-xs shadow-md">▲</button>
                  <button onClick={(e) => { e.stopPropagation(); moveQuest(idx, 'down'); }} className="w-8 h-8 bg-gray-500 text-white pixel-border border-black flex items-center justify-center text-xs shadow-md">▼</button>
                </div>
              </div>
            ))}
          </div>

          {/* System Terminal */}
          <div className="bg-[#1a1a2e] p-6 pixel-border border-white/10 text-white mb-10 shadow-inner overflow-hidden">
            <p className="text-[0.6em] pixel-font text-gray-500 mb-5 font-bold uppercase tracking-widest">{t.systemLogs}</p>
            <div className="space-y-4">
              {logs.map(log => (
                <div key={log.id} className="text-[0.8em] flex justify-between items-center border-l-4 border-yellow-500 pl-4 py-2 bg-white/5">
                  <span className="opacity-80 font-bold truncate pr-2">› {log.message}</span>
                  <span className="text-yellow-400 font-black shrink-0">{log.impact}</span>
                </div>
              ))}
              {logs.length === 0 && <p className="opacity-20 italic text-center text-[0.8em]">JOURNAL IS CLEAR...</p>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCalendar = () => {
    const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const end = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
    const startDay = start.getDay();
    const days = [];
    for(let i=0; i<startDay; i++) days.push(null);
    for(let i=1; i<=end.getDate(); i++) days.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), i));

    return (
      <div className={`bg-white p-8 pixel-border border-black min-h-screen ${fontSizeClass}`}>
        <div className="flex justify-between items-center mb-8 border-b-4 border-black pb-6 sticky top-0 bg-white z-20">
          <button onClick={() => { hapticFeedback(); setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1))); }} className="pixel-button text-[0.7em] font-black">PREV</button>
          <div onClick={() => { hapticFeedback(); setIsYearPicker(!isYearPicker); }} className="cursor-pointer active:scale-95 px-4 py-2 pixel-border border-black bg-yellow-50">
            <h2 className="pixel-font text-[0.8em] font-black uppercase">{viewDate.toLocaleString(lang === 'cn' ? 'zh-CN' : 'en-US', { month: 'long', year: 'numeric' })}</h2>
          </div>
          <button onClick={() => { hapticFeedback(); setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1))); }} className="pixel-button text-[0.7em] font-black">NEXT</button>
        </div>

        {isYearPicker && (
          <div className="mb-8 p-6 bg-yellow-50 pixel-border border-black flex justify-around items-center border-dashed">
            <button onClick={() => { hapticFeedback(); setViewDate(new Date(viewDate.setFullYear(viewDate.getFullYear() - 1))); }} className="pixel-button text-[0.6em]">-1 YEAR</button>
            <span className="pixel-font text-[1em] font-black">{viewDate.getFullYear()}</span>
            <button onClick={() => { hapticFeedback(); setViewDate(new Date(viewDate.setFullYear(viewDate.getFullYear() + 1))); }} className="pixel-button text-[0.6em]">+1 YEAR</button>
          </div>
        )}

        <div className="grid grid-cols-7 gap-2 mb-6 text-center">
          {['S','M','T','W','T','F','S'].map(d => <div key={d} className="pixel-font text-[0.6em] opacity-40 font-black">{d}</div>)}
          {days.map((d, i) => {
            if (!d) return <div key={`empty-${i}`} />;
            const iso = d.toISOString().split('T')[0];
            const entry = history.find(h => h.date === iso);
            const isToday = iso === new Date().toISOString().split('T')[0];
            return (
              <button 
                key={iso}
                onClick={() => { setSelectedDay(entry || { date: iso, hp: 0, hunger: 0, xp: 0 }); hapticFeedback(); }}
                className={`aspect-square pixel-border border-black p-1 flex flex-col items-center justify-center relative ${isToday ? 'bg-yellow-200 ring-2 ring-yellow-500 shadow-md' : 'bg-gray-50'} active:bg-blue-100 transition-colors`}
              >
                <span className="text-[0.6em] absolute top-1 left-1 font-bold">{d.getDate()}</span>
                {entry && (
                   <div className="flex gap-1 mt-4">
                      <div className="w-2.5 h-2.5 bg-red-500 pixel-border border-[1px] opacity-80" />
                      {entry.xp > 5 && <div className="w-2.5 h-2.5 bg-green-500 pixel-border border-[1px] opacity-80" />}
                   </div>
                )}
              </button>
            );
          })}
        </div>

        {selectedDay && (
          <div className="mt-10 p-8 bg-[#1a1a2e] text-white pixel-border border-white/20 shadow-2xl relative">
            <button onClick={() => setSelectedDay(null)} className="absolute top-4 right-4 pixel-font text-red-400 text-[0.8em] font-black">CLOSE</button>
            <h3 className="pixel-font text-[1em] mb-6 border-b border-white/10 pb-4 font-black">{t.summary}</h3>
            <div className="space-y-6">
               <p className="text-yellow-400 pixel-font text-[0.8em] font-bold">{selectedDay.date}</p>
               <div className="grid grid-cols-3 gap-4 text-center py-6 bg-white/5 pixel-border border-white/10">
                  <div>
                    <p className="text-[0.5em] pixel-font opacity-50 mb-1 uppercase">HP</p>
                    <p className="text-[1.2em] font-black text-red-500">{selectedDay.hp}</p>
                  </div>
                  <div>
                    <p className="text-[0.5em] pixel-font opacity-50 mb-1 uppercase">ENERGY</p>
                    <p className="text-[1.2em] font-black text-orange-400">{selectedDay.hunger}</p>
                  </div>
                  <div>
                    <p className="text-[0.5em] pixel-font opacity-50 mb-1 uppercase">EXP</p>
                    <p className="text-[1.2em] font-black text-green-400">{selectedDay.xp}</p>
                  </div>
               </div>
               <div className="p-5 bg-white/5 border-l-8 border-yellow-500">
                  <p className="text-[0.6em] pixel-font opacity-50 mb-2 uppercase font-black">{t.status}</p>
                  <p className="text-[1.2em] font-black text-yellow-500 leading-tight">
                    {getStatusAchievement(selectedDay.hp, selectedDay.xp, selectedDay.hunger)}
                  </p>
               </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSettings = () => (
    <div className={`bg-white p-10 pixel-border border-black min-h-screen space-y-12 ${fontSizeClass}`}>
      <h2 className={`pixel-font text-[1.2em] border-b-8 border-black pb-6 font-black uppercase`}>{t.settings}</h2>
      
      <div className="space-y-6">
        <p className="pixel-font text-[0.7em] opacity-60 font-black uppercase tracking-widest">{t.language}</p>
        <div className="grid grid-cols-1 gap-4">
          {(['en', 'cn'] as Language[]).map(l => (
            <button key={l} onClick={() => { setLang(l); hapticFeedback(); }} className={`p-6 pixel-border border-black pixel-font text-[0.8em] flex justify-between font-black shadow-md ${lang === l ? 'bg-black text-white' : 'bg-white'}`}>
              <span>{l === 'cn' ? '简体中文' : 'ENGLISH'}</span>
              {lang === l && <span>✓</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <p className="pixel-font text-[0.7em] opacity-60 font-black uppercase tracking-widest">{t.fontSize}</p>
        <div className="grid grid-cols-3 gap-4">
          {(['small', 'medium', 'large'] as FontSize[]).map(f => (
            <button key={f} onClick={() => { setFontSize(f); hapticFeedback(); }} className={`p-4 pixel-border border-black pixel-font text-[0.6em] font-black shadow-md ${fontSize === f ? 'bg-indigo-600 text-white' : 'bg-white'}`}>
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 bg-gray-50 pixel-border border-black flex justify-between items-center shadow-lg">
        <span className="pixel-font text-[0.8em] font-black uppercase">{t.sound}</span>
        <button onClick={() => { hapticFeedback(); setSfx(!sfx); playBeep(); }} className={`px-10 py-4 pixel-border border-black pixel-font text-[0.7em] font-black ${sfx ? 'bg-green-500' : 'bg-red-500 text-white'}`}>
          {sfx ? t.on : t.off}
        </button>
      </div>

      <div className="pt-20">
        <button onClick={() => { if(confirm('WIPE ALL DATA?')) { localStorage.clear(); location.reload(); } }} className="w-full p-6 bg-red-600 text-white pixel-border border-black pixel-font text-[0.8em] font-black shadow-2xl active:translate-y-2 active:shadow-none transition-all uppercase">FACTORY RESET</button>
      </div>
    </div>
  );

  return (
    <Background>
      <div className="scroll-container">
        {activeTab === 'home' && renderHome()}
        {activeTab === 'calendar' && renderCalendar()}
        {activeTab === 'settings' && renderSettings()}
      </div>

      {/* Editor Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[120] flex items-end">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsEditing(null)}></div>
          <form onSubmit={saveQuest} className="bottom-sheet relative w-full bg-white pixel-border border-black border-b-0 p-10 rounded-t-[50px] shadow-2xl space-y-8">
            <div className="w-24 h-2 bg-gray-300 rounded-full mx-auto mb-6"></div>
            <h2 className="pixel-font text-[1.2em] font-black border-b-8 border-black pb-4 uppercase">{isEditing === 'new' ? t.addQuest : t.edit}</h2>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[0.6em] pixel-font font-black opacity-40 uppercase">TITLE</label>
                <input name="title" autoFocus required className="w-full p-6 pixel-border border-black text-[1em] font-bold outline-none focus:bg-yellow-50" defaultValue={isEditing !== 'new' ? quests.find(q => q.id === isEditing)?.title : ''} />
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[0.6em] pixel-font font-black opacity-40 uppercase">ICON</label>
                    <input name="icon" required className="w-full p-6 pixel-border border-black text-[2em] text-center" defaultValue={isEditing !== 'new' ? quests.find(q => q.id === isEditing)?.icon : '⭐'} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[0.6em] pixel-font font-black opacity-40 uppercase">HP IMPACT</label>
                    <input name="hp" type="number" required className="w-full p-6 pixel-border border-black text-[1em] text-center font-black" defaultValue={isEditing !== 'new' ? quests.find(q => q.id === isEditing)?.hpImpact : 0} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[0.6em] pixel-font font-black opacity-40 uppercase">FOOD IMPACT</label>
                    <input name="hunger" type="number" required className="w-full p-6 pixel-border border-black text-[1em] text-center font-black" defaultValue={isEditing !== 'new' ? quests.find(q => q.id === isEditing)?.hungerImpact : 0} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[0.6em] pixel-font font-black opacity-40 uppercase">XP GAIN</label>
                    <input name="xp" type="number" required className="w-full p-6 pixel-border border-black text-[1em] text-center font-black" defaultValue={isEditing !== 'new' ? quests.find(q => q.id === isEditing)?.xpImpact : 0} />
                 </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button type="submit" className="flex-1 bg-green-500 text-white p-6 pixel-border border-black pixel-font text-[0.8em] font-black shadow-lg">OK</button>
              <button type="button" onClick={() => setIsEditing(null)} className="flex-1 bg-gray-400 text-white p-6 pixel-border border-black pixel-font text-[0.8em] font-black shadow-lg">BACK</button>
            </div>
            
            {isEditing !== 'new' && (
              <button type="button" onClick={() => { hapticFeedback('heavy'); setQuests(prev => prev.filter(x => x.id !== isEditing)); setIsEditing(null); }} className="w-full bg-red-100 text-red-600 p-4 pixel-border border-red-200 pixel-font text-[0.6em] font-black uppercase">DELETE THIS QUEST</button>
            )}
          </form>
        </div>
      )}

      {/* Nav Bar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#2b2b3b] border-t-8 border-yellow-500 px-6 pt-6 pb-[calc(2.5rem+env(safe-area-inset-bottom))] flex justify-around z-[110] shadow-2xl">
        <button onClick={() => { hapticFeedback(); setActiveTab('home'); }} className={`flex flex-col items-center flex-1 transition-all ${activeTab === 'home' ? 'text-yellow-400 scale-125' : 'text-gray-500 opacity-60'}`}>
          <span className="text-5xl mb-2">🏠</span>
          <span className={`pixel-font text-[0.6em] font-black uppercase`}>{t.home}</span>
        </button>
        <button onClick={() => { hapticFeedback(); setActiveTab('calendar'); }} className={`flex flex-col items-center flex-1 transition-all ${activeTab === 'calendar' ? 'text-yellow-400 scale-125' : 'text-gray-500 opacity-60'}`}>
          <span className="text-5xl mb-2">📅</span>
          <span className={`pixel-font text-[0.6em] font-black uppercase`}>{t.calendar}</span>
        </button>
        <button onClick={() => { hapticFeedback(); setActiveTab('settings'); }} className={`flex flex-col items-center flex-1 transition-all ${activeTab === 'settings' ? 'text-yellow-400 scale-125' : 'text-gray-500 opacity-60'}`}>
          <span className="text-5xl mb-2">⚙️</span>
          <span className={`pixel-font text-[0.6em] font-black uppercase`}>{t.settings}</span>
        </button>
      </nav>

      {/* Bounce Effects */}
      {clickEffect && (
        <div 
          className="fixed pointer-events-none z-[200] text-yellow-400 font-black pixel-font text-2xl animate-bounce select-none whitespace-nowrap bg-black/50 px-4 py-2 pixel-border border-yellow-400 shadow-2xl"
          style={{ left: clickEffect.x - 30, top: clickEffect.y - 80 }}
        >
          {clickEffect.text}
        </div>
      )}
    </Background>
  );
};

export default App;
