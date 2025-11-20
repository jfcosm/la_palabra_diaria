import React, { useState, useEffect, useCallback } from 'react';
import { fetchDailyReadings, fetchDailyContext } from './services/geminiService';
import { DailyReadings, DailyContext, LoadingState, TextSize, Theme, NewsItem } from './types';
import { SunIcon, MoonIcon, TextSizeIcon, LogoIcon, BookIcon, InfoIcon, CalendarIcon, AudioIcon, SaintIcon, NewsIcon, ExternalLinkIcon, ChevronDownIcon, ChevronUpIcon, PlayIcon, HomilyIcon, XMarkIcon } from './components/Icon';
import { ReadingSection } from './components/ReadingSection';

const App: React.FC = () => {
  const [readings, setReadings] = useState<DailyReadings | null>(null);
  const [contextData, setContextData] = useState<DailyContext | null>(null);
  
  const [readingsStatus, setReadingsStatus] = useState<LoadingState>('loading');
  const [contextStatus, setContextStatus] = useState<LoadingState>('loading');
  
  const [textSize, setTextSize] = useState<TextSize>(TextSize.Medium);
  const [theme, setTheme] = useState<Theme>(Theme.Light);
  const [showInfo, setShowInfo] = useState(false);
  const [showReadings, setShowReadings] = useState(false);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  
  // News Reader Logic
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  
  // Date logic
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Initialize theme based on system preference
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme(Theme.Dark);
    }
  }, []);

  // Apply theme class to document
  useEffect(() => {
    if (theme === Theme.Dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const loadData = useCallback(async () => {
    // Reset states
    setReadingsStatus('loading');
    setContextStatus('loading');
    setReadings(null);
    setContextData(null);
    // Collapsed by default when date changes
    setShowReadings(false);
    setShowAudioPlayer(false);
    setSelectedNews(null);

    // 1. Fetch Readings (Critical, Fast)
    try {
      const data = await fetchDailyReadings(currentDate);
      setReadings(data);
      setReadingsStatus('success');
    } catch (error) {
      console.error('Failed to load readings:', error);
      setReadingsStatus('error');
    }

    // 2. Fetch Context (Secondary, Slower, uses Search)
    try {
      const ctx = await fetchDailyContext(currentDate);
      setContextData(ctx);
      setContextStatus('success');
    } catch (error) {
      console.error('Failed to load context:', error);
      setContextStatus('error');
    }
  }, [currentDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleTheme = () => {
    setTheme(prev => prev === Theme.Light ? Theme.Dark : Theme.Light);
  };

  const cycleTextSize = () => {
    setTextSize(prev => {
      if (prev === TextSize.Small) return TextSize.Medium;
      if (prev === TextSize.Medium) return TextSize.Large;
      return TextSize.Small;
    });
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const dateString = event.target.value;
    if (!dateString) return;
    const [year, month, day] = dateString.split('-').map(Number);
    const newDate = new Date(year, month - 1, day);
    setCurrentDate(newDate);
  };

  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getColorClass = (colorName: string) => {
    const c = colorName.toLowerCase();
    if (c.includes('verde') || c.includes('green')) return 'text-green-800 dark:text-green-400';
    if (c.includes('rojo') || c.includes('red')) return 'text-red-800 dark:text-red-400';
    if (c.includes('morado') || c.includes('purple') || c.includes('violeta')) return 'text-purple-800 dark:text-purple-400';
    if (c.includes('rosa') || c.includes('rose')) return 'text-pink-700 dark:text-pink-400';
    return 'text-stone-700 dark:text-stone-200';
  };

  const getHeaderColorBg = (colorName: string) => {
    const c = colorName.toLowerCase();
    if (c.includes('verde')) return 'bg-green-50/80 dark:bg-green-900/20 text-green-900 dark:text-green-100 border-green-200 dark:border-green-800/50';
    if (c.includes('rojo')) return 'bg-red-50/80 dark:bg-red-900/20 text-red-900 dark:text-red-100 border-red-200 dark:border-red-800/50';
    if (c.includes('morado')) return 'bg-purple-50/80 dark:bg-purple-900/20 text-purple-900 dark:text-purple-100 border-purple-200 dark:border-purple-800/50';
    if (c.includes('rosa')) return 'bg-pink-50/80 dark:bg-pink-900/20 text-pink-900 dark:text-pink-100 border-pink-200 dark:border-pink-800/50';
    return 'bg-amber-50/80 dark:bg-yellow-900/20 text-amber-900 dark:text-amber-100 border-amber-200 dark:border-amber-800/50';
  };
  
  const getLiturgicalGradient = (colorName: string) => {
    const c = colorName.toLowerCase();
    // Much softer, elegant gradients
    if (c.includes('verde')) return 'from-green-50/50 to-stone-50 dark:from-slate-900 dark:to-slate-950';
    if (c.includes('rojo')) return 'from-red-50/50 to-stone-50 dark:from-slate-900 dark:to-slate-950';
    if (c.includes('morado')) return 'from-purple-50/50 to-stone-50 dark:from-slate-900 dark:to-slate-950';
    return 'from-stone-100 to-stone-50 dark:from-slate-900 dark:to-slate-950';
  };

  return (
    <div className="min-h-screen font-sans transition-colors duration-500 ease-in-out pb-20 relative bg-stone-50 dark:bg-slate-950 text-stone-800 dark:text-stone-100">
      
      {/* --- INFO MODAL --- */}
      {showInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/40 dark:bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-8 relative overflow-hidden border border-stone-100 dark:border-slate-700">
             <button 
                onClick={() => setShowInfo(false)}
                className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors rounded-full hover:bg-stone-100 dark:hover:bg-slate-800"
             >
               <XMarkIcon className="w-5 h-5" />
             </button>
             
             <div className="flex flex-col items-center text-center">
               <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-700 dark:text-indigo-400 mb-6 shadow-sm">
                  <LogoIcon className="w-8 h-8" />
               </div>
               <h3 className="text-2xl font-bold text-stone-900 dark:text-white mb-4 font-serif">La Palabra Diaria</h3>
               <div className="space-y-4 text-stone-600 dark:text-stone-300 text-base leading-relaxed font-light">
                 <p>Bienvenido, hermano y hermana en Cristo.</p>
                 <p>Esta plataforma ha sido diseñada con simplicidad para acompañar tu vida de fe. Aquí encontrarás las lecturas de la misa, el santoral, noticias de la Iglesia y reflexiones espirituales.</p>
               </div>
               <div className="mt-8 pt-6 border-t border-stone-100 dark:border-slate-800 w-full">
                 <p className="text-sm text-stone-400 italic font-serif">"Lámpara es tu palabra para mis pasos, luz en mi sendero." <br/>— Salmo 119, 105</p>
               </div>
             </div>
          </div>
        </div>
      )}

      {/* --- NEWS READER MODAL (INTERNAL) --- */}
      {selectedNews && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/50 dark:bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl border border-stone-100 dark:border-slate-700 flex flex-col max-h-[90vh] animate-fade-in-up relative">
            
            {/* Header */}
            <div className="p-6 border-b border-stone-100 dark:border-slate-800 flex items-start justify-between bg-stone-50/50 dark:bg-slate-900/50 sticky top-0 z-10 sm:rounded-t-2xl">
              <div className="pr-8">
                 <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">{selectedNews.source}</div>
                 <h2 className="text-xl md:text-2xl font-bold text-stone-900 dark:text-white font-serif leading-tight">{selectedNews.title}</h2>
              </div>
              <button 
                onClick={() => setSelectedNews(null)}
                className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 bg-stone-100 dark:bg-slate-800 rounded-full transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar">
               <div className={`font-serif text-lg leading-relaxed text-stone-800 dark:text-stone-300 whitespace-pre-wrap`}>
                  {selectedNews.body}
               </div>
               {selectedNews.url && selectedNews.url !== 'https://www.vaticannews.va/es.html' && (
                 <div className="mt-8 pt-6 border-t border-stone-100 dark:border-slate-800">
                    <a href={selectedNews.url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                      Ver fuente original <ExternalLinkIcon className="w-3 h-3" />
                    </a>
                 </div>
               )}
            </div>

          </div>
        </div>
      )}

      {/* --- HEADER --- */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-stone-200 dark:border-slate-800 transition-all duration-300 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-default">
            <div className="text-indigo-700 dark:text-indigo-400 transition-transform group-hover:scale-105 duration-300">
              <LogoIcon className="w-7 h-7" />
            </div>
            <h1 className="font-bold text-lg md:text-xl text-stone-800 dark:text-stone-100 tracking-tight font-serif">
              La Palabra Diaria
            </h1>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <div className="relative p-2 rounded-full hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors text-stone-600 dark:text-stone-400 cursor-pointer">
              <CalendarIcon className="w-5 h-5" />
              <input 
                type="date" 
                value={formatDateForInput(currentDate)}
                onChange={handleDateChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                aria-label="Seleccionar fecha"
              />
            </div>
            <div className="w-px h-5 bg-stone-200 dark:bg-slate-700 mx-1"></div>
            <button onClick={() => setShowInfo(true)} className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors text-stone-600 dark:text-stone-400">
              <InfoIcon className="w-5 h-5" />
            </button>
            <button onClick={cycleTextSize} className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors text-stone-600 dark:text-stone-400">
              <TextSizeIcon className="w-5 h-5" />
            </button>
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors text-stone-600 dark:text-stone-400">
              {theme === Theme.Light ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <main className="w-full">
        {/* --- HERO SECTION: LECTURAS --- */}
        <section className={`pt-12 pb-16 px-4 bg-gradient-to-b ${readings ? getLiturgicalGradient(readings.liturgical_color) : 'from-stone-50 to-white'} transition-colors duration-700`}>
          <div className="max-w-3xl mx-auto">
            {readingsStatus === 'loading' && (
              <div className="flex flex-col items-center justify-center py-24 animate-pulse">
                <BookIcon className="w-12 h-12 text-stone-300 dark:text-slate-700 mb-6" />
                <div className="h-4 bg-stone-200 dark:bg-slate-800 rounded w-48 mb-3"></div>
                <div className="h-3 bg-stone-200 dark:bg-slate-800 rounded w-32"></div>
              </div>
            )}

            {readingsStatus === 'error' && (
               <div className="text-center py-20">
                  <p className="text-red-600 dark:text-red-400 mb-4 font-medium">No se pudieron cargar las lecturas.</p>
                  <button onClick={loadData} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-sm font-semibold transition-all shadow-md">Reintentar</button>
               </div>
            )}

            {readingsStatus === 'success' && readings && (
              <div className="animate-fade-in-up">
                
                {/* Date Display */}
                <div className="text-center mb-10">
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-stone-900 dark:text-stone-50 mb-8 font-serif tracking-tight">
                    {readings.date}
                  </h1>
                  
                  {/* EMPHASIZED LITURGICAL CARD (REDUCED SIZE 50%) */}
                  <div className={`mx-auto max-w-sm p-5 rounded-xl border shadow-sm ${getHeaderColorBg(readings.liturgical_color)} mb-8 transform transition-all duration-500`}>
                    <span className="block text-[10px] font-extrabold uppercase tracking-[0.2em] mb-1 opacity-80">Tiempo Litúrgico</span>
                    <h2 className="text-lg md:text-xl font-bold uppercase tracking-wide font-serif leading-tight">
                      {readings.liturgical_season}
                    </h2>
                    <div className="mt-1 opacity-75 text-xs font-medium uppercase tracking-wider">{readings.liturgical_color}</div>
                  </div>

                  {/* EXPAND BUTTON */}
                  <button 
                    onClick={() => setShowReadings(!showReadings)}
                    className="w-full max-w-md mx-auto group relative flex items-center justify-center gap-3 bg-indigo-700 hover:bg-indigo-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white py-4 px-8 rounded-full font-bold text-lg shadow-lg shadow-indigo-700/20 hover:shadow-indigo-700/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 border border-transparent"
                  >
                    <span>{showReadings ? 'Ocultar Lecturas' : 'Leer las Lecturas de Hoy'}</span>
                    {showReadings ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                  </button>
                </div>

                {/* Readings Content (Collapsed) */}
                <div className={`overflow-hidden transition-[max-height] duration-1000 ease-in-out ${showReadings ? 'max-h-[6000px]' : 'max-h-0'}`}>
                    <div className="space-y-16 bg-white dark:bg-slate-900 p-6 sm:p-12 rounded-[2rem] shadow-xl shadow-stone-200/50 dark:shadow-black/40 border border-stone-100 dark:border-slate-800 mb-8 relative">
                      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"></div>
                      
                      <ReadingSection title="Primera Lectura" type="Primera Lectura" data={readings.first_reading} textSize={textSize} colorClass={getColorClass(readings.liturgical_color)} />
                      <ReadingSection title="Salmo Responsorial" type="Salmo" data={readings.psalm} textSize={textSize} colorClass={getColorClass(readings.liturgical_color)} />
                      {readings.second_reading && (
                        <ReadingSection title="Segunda Lectura" type="Segunda Lectura" data={readings.second_reading} textSize={textSize} colorClass={getColorClass(readings.liturgical_color)} />
                      )}
                      <ReadingSection title="Santo Evangelio" type="Evangelio" data={readings.gospel} textSize={textSize} colorClass={getColorClass(readings.liturgical_color)} />
                      
                      {/* HOMILY SECTION */}
                      {readings.reflection && (
                        <div className="mt-16 pt-12 border-t-2 border-dashed border-stone-200 dark:border-slate-700">
                           <div className="flex items-center gap-3 mb-6 justify-center text-amber-700 dark:text-amber-500">
                             <HomilyIcon className="w-6 h-6" />
                             <span className="text-xs font-bold uppercase tracking-widest">Reflexión Pastoral</span>
                           </div>
                           
                           <div className="bg-stone-50 dark:bg-slate-800/30 p-8 rounded-2xl border border-stone-100 dark:border-slate-700/50">
                              <h3 className="text-xl md:text-2xl font-bold text-center text-stone-800 dark:text-stone-100 mb-6 font-serif">
                                {readings.reflection.title}
                              </h3>
                              <div className={`${textSize} leading-loose text-stone-700 dark:text-stone-300 font-serif text-justify opacity-90 italic`}>
                                {readings.reflection.text}
                              </div>
                           </div>
                        </div>
                      )}

                      <div className="flex justify-center pt-10 pb-2">
                         <button 
                            onClick={() => setShowReadings(false)} 
                            className="text-stone-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-2 text-sm font-bold uppercase tracking-wider transition-colors"
                         >
                            <ChevronUpIcon className="w-4 h-4" />
                            Cerrar lecturas
                         </button>
                      </div>
                    </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* --- SECTION DIVIDER --- */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-stone-300 dark:via-slate-700 to-transparent my-4 opacity-50"></div>

        {/* --- SECONDARY CONTENT GRID --- */}
        <section className="py-16 px-4 max-w-6xl mx-auto">
           
           <h2 className="text-2xl md:text-3xl font-bold text-center text-stone-800 dark:text-stone-100 mb-16 font-serif">
              <span className="border-b-4 border-indigo-200 dark:border-indigo-900 pb-1">Vida en la Fe</span>
           </h2>

           {contextStatus === 'loading' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
                 <div className="h-56 bg-stone-200 dark:bg-slate-800 rounded-2xl"></div>
                 <div className="h-56 bg-stone-200 dark:bg-slate-800 rounded-2xl"></div>
              </div>
           )}

           {contextStatus === 'success' && contextData && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* AUDIO CARD */}
                <div className="lg:col-span-7 flex flex-col">
                  <div className="bg-gradient-to-br from-indigo-600 to-blue-700 dark:from-indigo-900 dark:to-blue-950 rounded-3xl p-8 sm:p-10 text-white shadow-2xl shadow-indigo-900/10 hover:shadow-indigo-900/20 transition-all h-full flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                    
                    <div>
                      <div className="flex items-center gap-3 mb-5 opacity-80">
                        <AudioIcon className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase tracking-widest">Reflexión del día</span>
                      </div>
                      <h3 className="text-3xl md:text-4xl font-bold mb-3 font-serif leading-tight">
                        {contextData.audio_reflection.title || 'La Buena Semilla'}
                      </h3>
                      <p className="text-indigo-100 mb-8 text-base font-light">
                        Escucha la reflexión diaria cortesía de <span className="font-semibold">{contextData.audio_reflection.source_name}</span>.
                      </p>
                    </div>
                    
                    {/* Audio Player / Button */}
                    <div className="mt-auto z-10">
                        {!showAudioPlayer ? (
                          <button 
                            onClick={() => setShowAudioPlayer(true)}
                            className="inline-flex items-center gap-3 bg-white text-indigo-700 px-6 py-3.5 rounded-full font-bold hover:bg-indigo-50 transition-all w-fit shadow-lg active:scale-95"
                          >
                            <PlayIcon className="w-5 h-5 fill-current" />
                            <span>Escuchar Reflexión</span>
                          </button>
                        ) : (
                          <div className="w-full bg-white/10 rounded-2xl p-2 backdrop-blur-md animate-fade-in border border-white/20">
                             <div className="rounded-xl overflow-hidden shadow-inner bg-black/20">
                               <iframe 
                                  title="Embed Player" 
                                  width="100%" 
                                  height="188px" 
                                  src="https://embed.acast.com/5efd1ca547a8674aea2714bc/6903b8abbb560dc3069d7c19" 
                                  scrolling="no" 
                                  frameBorder="0" 
                                  style={{ border: 'none', overflow: 'hidden' }}
                                ></iframe>
                             </div>
                             <button 
                                onClick={() => setShowAudioPlayer(false)} 
                                className="w-full mt-2 py-2 text-xs text-indigo-100 hover:text-white transition-colors uppercase tracking-widest font-bold"
                             >
                                Cerrar reproductor
                             </button>
                          </div>
                        )}
                    </div>
                  </div>
                </div>

                {/* SAINT CARD */}
                <div className="lg:col-span-5 flex flex-col">
                   <div className="bg-white dark:bg-slate-900 border border-stone-100 dark:border-slate-700 rounded-3xl p-8 h-full flex flex-col justify-between shadow-xl shadow-stone-200/30 dark:shadow-none hover:border-purple-200 dark:hover:border-purple-800 transition-colors relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-purple-400 to-indigo-400"></div>
                      <SaintIcon className="absolute -bottom-6 -right-6 w-40 h-40 text-stone-50 dark:text-slate-800 rotate-12 transition-transform group-hover:rotate-6 duration-700" />
                      
                      <div>
                        <div className="flex items-center gap-2 mb-4 text-purple-700 dark:text-purple-400">
                          <SaintIcon className="w-5 h-5" />
                          <span className="text-xs font-bold uppercase tracking-widest">Santoral</span>
                        </div>
                        <h3 className="text-2xl md:text-3xl font-bold text-stone-900 dark:text-white mb-3 font-serif">
                          {contextData.saint.name}
                        </h3>
                        <p className="text-stone-600 dark:text-stone-300 text-base leading-relaxed mb-6 font-light">
                          {contextData.saint.description}
                        </p>
                      </div>

                      <a 
                        href={contextData.saint.wikipedia_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-bold text-purple-700 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300 transition-colors z-10 bg-purple-50 dark:bg-purple-900/30 px-4 py-2 rounded-full w-fit"
                      >
                        Leer biografía <ExternalLinkIcon className="w-3 h-3" />
                      </a>
                   </div>
                </div>

                {/* NEWS SECTION */}
                <div className="lg:col-span-12 mt-12">
                   <div className="flex items-center gap-3 mb-8 text-stone-500 dark:text-stone-400 border-b border-stone-200 dark:border-slate-800 pb-4">
                      <NewsIcon className="w-5 h-5" />
                      <h3 className="text-sm font-bold uppercase tracking-widest">Actualidad Vaticana</h3>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {contextData.news.map((item, idx) => (
                        <button 
                          key={idx} 
                          onClick={() => setSelectedNews(item)}
                          className="group block h-full w-full text-left focus:outline-none"
                        >
                          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-stone-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                             <h4 className="font-bold text-lg text-stone-900 dark:text-stone-100 mb-3 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 line-clamp-3 font-serif">
                               {item.title}
                             </h4>
                             <p className="text-sm text-stone-500 dark:text-stone-400 mb-5 flex-grow line-clamp-3 font-light">
                               {item.summary}
                             </p>
                             <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 uppercase tracking-wider">
                               Leer nota completa <ChevronDownIcon className="w-4 h-4 -rotate-90" />
                             </div>
                          </div>
                        </button>
                      ))}
                   </div>
                </div>

              </div>
           )}
        </section>
      </main>

      {/* --- FOOTER --- */}
      <footer className="mt-20 py-12 bg-white dark:bg-slate-950 border-t border-stone-200 dark:border-slate-800 text-center">
         <div className="max-w-3xl mx-auto px-4">
            <div className="text-stone-300 dark:text-slate-700 mb-6">
               <LogoIcon className="w-10 h-10 mx-auto opacity-50 hover:opacity-100 hover:text-indigo-600 transition-all duration-500" />
            </div>
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 mb-3 font-serif uppercase tracking-widest">La Palabra Diaria</h2>
            <p className="text-base text-stone-600 dark:text-stone-400 font-light mb-8">
              Desarrollado con fe y esperanza por el equipo de <a href="https://www.melodialab.pro" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">MelodIA La ♭</a>
            </p>
            <div className="h-px w-24 bg-stone-200 dark:bg-slate-800 mx-auto mb-8"></div>
            <p className="text-xs text-stone-400 dark:text-stone-600 max-w-md mx-auto leading-relaxed">
               Las lecturas son tomadas de la liturgia oficial católica. Los contenidos de noticias y audio son propiedad de sus respectivos autores y se muestran aquí con fines pastorales.
            </p>
         </div>
      </footer>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        @keyframes fadeIn {
           from { opacity: 0; }
           to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(168, 162, 158, 0.3);
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
};

export default App;