
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
    return saved ? JSON.parse(saved) : { health: 10, hunger: 10, experience: 0 };
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
  const [motivation, setMotivation] = useState("Loading...");
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [viewDate, setViewDate] = useState(new Date());
  const [isYearPicker, setIsYearPicker] = useState(false);
  const [clickEffect, setClickEffect] = useState<{id: string, x: number, y: number} | null>(null);

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
      const newEntry = { date: today, hp: stats.health, hunger: stats.hunger };
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = newEntry;
        return next;
      }
      return [...prev, newEntry];
    });
  }, [stats.health, stats.hunger]);

  const fetchMotivation = useCallback(async () => {
    const msg = await getDailyMotivation(stats.health, stats.hunger);
    setMotivation(msg);
  }, [stats.health, stats.hunger]);

  useEffect(() => { fetchMotivation(); }, [fetchMotivation]);

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
    setClickEffect({ id: quest.id, x: e.clientX, y: e.clientY });
    setTimeout(() => setClickEffect(null), 600);

    setStats(prev => ({
      ...prev,
      health: Math.min(MAX_STATS, Math.max(0, prev.health + quest.hpImpact)),
      hunger: Math.min(MAX_STATS, Math.max(0, prev.hunger + quest.hungerImpact))
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
  };

  const isCN = lang === 'cn';
  const fontSizeClass = fontSize === 'small' 
    ? (isCN ? 'text-[15px]' : 'text-[12px]') 
    : fontSize === 'large' 
    ? (isCN ? 'text-[24px]' : 'text-[20px]') 
    : (isCN ? 'text-[19px]' : 'text-[16px]');

  const pixelLabelClass = fontSize === 'small' 
    ? (isCN ? 'text-[12px]' : 'text-[10px]') 
    : fontSize === 'large' 
    ? (isCN ? 'text-[16px]' : 'text-[14px]') 
    : (isCN ? 'text-[14px]' : 'text-[12px]');

  // --- RENDERING ---

  const renderHome = () => {
    const todayStr = new Date().toLocaleDateString(lang === 'cn' ? 'zh-CN' : lang === 'fr' ? 'fr-FR' : 'en-US', { 
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
    });

    return (
      <div className={fontSizeClass}>
        <div className="bg-slate-900/80 text-white p-6 pixel-border mb-4 backdrop-blur-md sticky top-0 z-40">
          <div className="flex justify-between items-center">
            <h1 className="pixel-font text-sm tracking-tighter">LIFE RPG</h1>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
               <span className="text-[10px] pixel-font">ONLINE</span>
            </div>
          </div>
          <p className={`pixel-font ${isCN ? 'text-[14px]' : 'text-[12px]'} text-yellow-400 mt-2 uppercase`}>{todayStr}</p>
        </div>

        <div className="px-4">
          <div className="bg-white/95 p-5 pixel-border mb-4 flex gap-5 items-center relative overflow-hidden active:bg-gray-50 transition-colors" onClick={() => fetchMotivation()}>
            <div className="w-14 h-14 bg-indigo-100 flex items-center justify-center text-4xl pixel-border">🧙</div>
            <div className="flex-1">
              <p className={`pixel-font ${pixelLabelClass} text-gray-400 mb-1`}>{t.oracle}</p>
              <p className="font-bold leading-tight">{motivation}</p>
            </div>
          </div>

          <StatusBar health={stats.health} hunger={stats.hunger} fontSize={fontSize} lang={lang} />

          <div className="mb-4">
            <div className="flex justify-between items-center mb-3 px-1">
              <h2 className={`pixel-font ${isCN ? 'text-[14px]' : 'text-[12px]'}`}>{t.quests}</h2>
              <button onClick={() => { hapticFeedback(); setIsEditing('new'); }} className={`text-blue-600 pixel-font ${isCN ? 'text-[12px]' : 'text-[10px]'} underline`}>+{t.addQuest}</button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {quests.map((q, idx) => (
                <div key={q.id} className="relative group">
                  <button 
                    onClick={(e) => handleAction(q, e)}
                    className="w-full flex flex-col items-center p-5 bg-white/95 pixel-border hover:bg-yellow-50 active:scale-95 transition-all shadow-sm active:shadow-none"
                  >
                    <span className="text-5xl mb-3 drop-shadow-md">{q.icon}</span>
                    <span className={`pixel-font ${isCN ? 'text-[12px]' : 'text-[10px]'} text-center mb-1 leading-tight min-h-[40px] flex items-center justify-center`}>{q.title}</span>
                    <div className={`flex gap-3 ${isCN ? 'text-[13px]' : 'text-[11px]'} font-bold text-gray-500 mt-2`}>
                      <span className="flex items-center gap-1">❤️{q.hpImpact >= 0 ? '+' : ''}{q.hpImpact}</span>
                      <span className="flex items-center gap-1">🍗{q.hungerImpact >= 0 ? '+' : ''}{q.hungerImpact}</span>
                    </div>
                  </button>
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); hapticFeedback(); setIsEditing(q.id); }} 
                    className="absolute top-2 right-2 w-10 h-10 bg-blue-500/10 hover:bg-blue-500/30 flex items-center justify-center rounded-full"
                  >
                    <span className="text-blue-600 text-lg">✎</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-indigo-900/95 p-5 pixel-border text-white mb-10 min-h-[120px]">
            <h3 className={`pixel-font ${pixelLabelClass} text-indigo-300 mb-3 uppercase tracking-widest`}>{t.systemLogs}</h3>
            <div className="space-y-3">
              {logs.map(log => (
                <div key={log.id} className="text-[14px] flex justify-between border-l-4 border-indigo-400 pl-4 py-1 bg-indigo-800/20">
                  <span>&gt; {log.message}</span>
                  <span className="text-yellow-400 font-bold">{log.impact}</span>
                </div>
              ))}
              {logs.length === 0 && <p className="opacity-30 italic text-[14px]">Logs are empty...</p>}
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

    const monthName = viewDate.toLocaleString(lang === 'cn' ? 'zh-CN' : lang === 'fr' ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' });

    return (
      <div className={`bg-white/95 p-8 pixel-border min-h-screen ${fontSizeClass}`}>
        <div className="flex justify-between items-center mb-8 border-b-4 border-black pb-4 sticky top-0 bg-white/95 z-40 p-2">
          <button onClick={() => { hapticFeedback(); setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1))); }} className="pixel-button text-[14px] p-2">PREV</button>
          <div onClick={() => { hapticFeedback(); setIsYearPicker(!isYearPicker); }} className="cursor-pointer active:scale-95 px-5 py-2 pixel-border bg-white shadow-md transition-all">
            <h2 className={`pixel-font ${isCN ? 'text-[14px]' : 'text-[12px]'} text-center font-bold`}>{monthName.toUpperCase()}</h2>
          </div>
          <button onClick={() => { hapticFeedback(); setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1))); }} className="pixel-button text-[14px] p-2">NEXT</button>
        </div>

        {isYearPicker && (
          <div className="mb-8 p-6 bg-yellow-50 pixel-border border-dashed flex justify-around items-center">
            <button onClick={() => { hapticFeedback(); setViewDate(new Date(viewDate.setFullYear(viewDate.getFullYear() - 1))); }} className="pixel-button text-[12px]">-1Y</button>
            <span className="pixel-font text-[18px] font-black">{viewDate.getFullYear()}</span>
            <button onClick={() => { hapticFeedback(); setViewDate(new Date(viewDate.setFullYear(viewDate.getFullYear() + 1))); }} className="pixel-button text-[12px]">+1Y</button>
            <button onClick={() => setIsYearPicker(false)} className="text-[12px] pixel-font text-red-500 ml-4">DONE</button>
          </div>
        )}

        <div className="grid grid-cols-7 gap-2 text-center font-black mb-4">
          {['S','M','T','W','T','F','S'].map(d => <div key={d} className="opacity-40 text-[14px]">{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-3">
          {days.map((d, i) => {
            if (!d) return <div key={`empty-${i}`} className="aspect-square opacity-0"></div>;
            const iso = d.toISOString().split('T')[0];
            const entry = history.find(h => h.date === iso);
            const isToday = iso === new Date().toISOString().split('T')[0];
            
            return (
              <div key={iso} className={`aspect-square pixel-border p-1 flex flex-col items-center justify-center relative active:bg-blue-50 ${isToday ? 'bg-yellow-100 ring-3 ring-yellow-400' : 'bg-gray-50'}`}>
                <span className="text-[12px] absolute top-1 left-1 font-bold">{d.getDate()}</span>
                {entry ? (
                  <div className="flex flex-col items-center mt-4">
                    <div className="w-3.5 h-3.5 bg-red-500 mb-1 pixel-border border-[1px]" style={{ opacity: Math.max(0.2, entry.hp / 10) }}></div>
                    <div className="w-3.5 h-3.5 bg-orange-400 pixel-border border-[1px]" style={{ opacity: Math.max(0.2, entry.hunger / 10) }}></div>
                  </div>
                ) : <span className="text-[12px] opacity-10">.</span>}
              </div>
            );
          })}
        </div>

        <div className="mt-12 p-6 bg-gray-100 pixel-border border-dashed">
          <p className={`pixel-font ${pixelLabelClass} mb-4 font-bold`}>{isCN ? '图例说明' : 'LEGEND:'}</p>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-red-500 pixel-border"></div>
              <span className="text-[16px] font-black">{isCN ? '生命值 (0-10)' : 'HEALTH (0-10)'}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-orange-400 pixel-border"></div>
              <span className="text-[16px] font-black">{isCN ? '饱食度 (0-10)' : 'HUNGER (0-10)'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className={`bg-white p-10 pixel-border min-h-screen space-y-10 ${fontSizeClass}`}>
      <h2 className={`pixel-font ${isCN ? 'text-[18px]' : 'text-[14px]'} border-b-3 border-black pb-4`}>{t.settings}</h2>
      
      <div className="space-y-4">
        <p className={`pixel-font ${pixelLabelClass} opacity-60`}>{t.language}</p>
        <div className="grid grid-cols-1 gap-3">
          {(['en', 'cn', 'fr'] as Language[]).map(l => (
            <button key={l} onClick={() => { hapticFeedback(); setLang(l); playBeep(); }} className={`p-4 pixel-border pixel-font text-[14px] flex justify-between items-center ${lang === l ? 'bg-blue-500 text-white' : 'bg-white'}`}>
              <span>{l === 'cn' ? '简体中文' : l === 'en' ? 'ENGLISH' : 'FRANÇAIS'}</span>
              {lang === l && <span>✓</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <p className={`pixel-font ${pixelLabelClass} opacity-60`}>{t.fontSize}</p>
        <div className="grid grid-cols-3 gap-4">
          {(['small', 'medium', 'large'] as FontSize[]).map(f => (
            <button key={f} onClick={() => { hapticFeedback(); setFontSize(f); playBeep(); }} className={`p-4 pixel-border pixel-font ${isCN ? 'text-[12px]' : 'text-[10px]'} ${fontSize === f ? 'bg-indigo-500 text-white' : 'bg-white'}`}>
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 bg-gray-50 pixel-border flex justify-between items-center">
        <span className={`pixel-font ${pixelLabelClass}`}>{t.sound}</span>
        <button onClick={() => { hapticFeedback(); setSfx(!sfx); playBeep(); }} className={`px-8 py-3 pixel-border pixel-font ${isCN ? 'text-[12px]' : 'text-[10px]'} ${sfx ? 'bg-green-400 text-white' : 'bg-red-400 text-white'}`}>
          {sfx ? t.on : t.off}
        </button>
      </div>

      <div className="pt-12">
        <button onClick={() => { hapticFeedback('heavy'); if(confirm('Factory Reset?')) { localStorage.clear(); location.reload(); } }} className="w-full p-4 bg-red-600 text-white pixel-border pixel-font text-[14px]">RESET ALL DATA</button>
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

      {/* BOTTOM SHEET EDITOR */}
      {isEditing && (
        <div className="fixed inset-0 z-[110] flex items-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditing(null)}></div>
          <form onSubmit={saveQuest} className="bottom-sheet relative w-full bg-white pixel-border border-b-0 p-8 rounded-t-3xl shadow-2xl space-y-6">
            <div className="w-16 h-1.5 bg-gray-300 rounded-full mx-auto mb-4"></div>
            <h2 className={`pixel-font ${isCN ? 'text-[16px]' : 'text-[14px]'} border-b-3 border-black pb-4`}>{isEditing === 'new' ? t.addQuest : t.edit}</h2>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] pixel-font opacity-40">QUEST TITLE</label>
                <input name="title" autoFocus placeholder="TITLE" required className="w-full p-4 pixel-border text-[16px] outline-none focus:bg-yellow-50" defaultValue={isEditing !== 'new' ? quests.find(q => q.id === isEditing)?.title : ''} />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                 <div className="space-y-1">
                    <label className="text-[10px] pixel-font opacity-40 text-center block">ICON</label>
                    <input name="icon" placeholder="Icon" required className="w-full p-4 pixel-border text-[20px] text-center" defaultValue={isEditing !== 'new' ? quests.find(q => q.id === isEditing)?.icon : '⭐'} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] pixel-font opacity-40 text-center block">HP +/-</label>
                    <input name="hp" type="number" placeholder="HP" required className="w-full p-4 pixel-border text-[16px] text-center" defaultValue={isEditing !== 'new' ? quests.find(q => q.id === isEditing)?.hpImpact : 0} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] pixel-font opacity-40 text-center block">HUN +/-</label>
                    <input name="hunger" type="number" placeholder="Food" required className="w-full p-4 pixel-border text-[16px] text-center" defaultValue={isEditing !== 'new' ? quests.find(q => q.id === isEditing)?.hungerImpact : 0} />
                 </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button type="submit" className="flex-1 bg-green-500 text-white p-5 pixel-border pixel-font text-[14px] active:scale-95">{t.save}</button>
              <button type="button" onClick={() => setIsEditing(null)} className="flex-1 bg-gray-400 text-white p-5 pixel-border pixel-font text-[14px] active:scale-95">{t.cancel}</button>
            </div>
            
            {isEditing !== 'new' && (
              <button type="button" onClick={() => { hapticFeedback('heavy'); setQuests(prev => prev.filter(x => x.id !== isEditing)); setIsEditing(null); }} className="w-full bg-red-100 text-red-600 p-3 pixel-border pixel-font text-[12px] hover:bg-red-200">{t.delete}</button>
            )}
          </form>
        </div>
      )}

      {/* NAVIGATION BAR - NATIVE APP STYLE */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t-5 border-black px-6 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] flex justify-around z-[100] shadow-[0_-10px_30px_rgba(0,0,0,0.4)]">
        <button onClick={() => { hapticFeedback(); setActiveTab('home'); playBeep(200); }} className={`flex flex-col items-center flex-1 transition-all ${activeTab === 'home' ? 'text-black scale-110' : 'opacity-30'}`}>
          <span className="text-3xl mb-1">🏠</span>
          <span className={`pixel-font ${isCN ? 'text-[12px]' : 'text-[9px]'} font-bold`}>{t.home}</span>
          {activeTab === 'home' && <div className="w-1.5 h-1.5 bg-black rounded-full mt-1"></div>}
        </button>
        <button onClick={() => { hapticFeedback(); setActiveTab('calendar'); playBeep(200); }} className={`flex flex-col items-center flex-1 transition-all ${activeTab === 'calendar' ? 'text-black scale-110' : 'opacity-30'}`}>
          <span className="text-3xl mb-1">📅</span>
          <span className={`pixel-font ${isCN ? 'text-[12px]' : 'text-[9px]'} font-bold`}>{t.calendar}</span>
          {activeTab === 'calendar' && <div className="w-1.5 h-1.5 bg-black rounded-full mt-1"></div>}
        </button>
        <button onClick={() => { hapticFeedback(); setActiveTab('settings'); playBeep(200); }} className={`flex flex-col items-center flex-1 transition-all ${activeTab === 'settings' ? 'text-black scale-110' : 'opacity-30'}`}>
          <span className="text-3xl mb-1">⚙️</span>
          <span className={`pixel-font ${isCN ? 'text-[12px]' : 'text-[9px]'} font-bold`}>{t.settings}</span>
          {activeTab === 'settings' && <div className="w-1.5 h-1.5 bg-black rounded-full mt-1"></div>}
        </button>
      </nav>

      {/* CLICK EFFECT LAYER */}
      {clickEffect && (
        <div 
          className="fixed pointer-events-none z-[200] text-red-500 font-bold pixel-font text-4xl animate-ping select-none"
          style={{ left: clickEffect.x - 30, top: clickEffect.y - 30 }}
        >
          ❤️
        </div>
      )}
    </Background>
  );
};

export default App;
