import { useState, useEffect } from 'react';
import { 
  Zap, Brain, Shield, Trophy, Activity, 
  BarChart2, Play, Star, 
  CheckCircle, XCircle, Info, ChevronRight,
  Swords, Target, Crosshair,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../App';

// --- CONFIGURACIÓN Y UTILIDADES ---
const PROP_TYPES = {
  MULT: 'Multiplicación de igual base',
  DIV: 'División de igual base',
  POW: 'Potencia de una potencia',
  ZERO: 'Exponente cero',
  NEG: 'Exponente negativo',
  COMB: 'Arena de Combinados'
};

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffleArray = (array: any[]) => [...array].sort(() => Math.random() - 0.5);

// --- MOTOR DE GENERACIÓN DE EJERCICIOS ---
const generateProblem = (level: number, forcedType: string | null = null) => {
  let type: string, base: number, exp1: number, exp2: number, exp3: number, correctAnswer: any, options: any[], layout: any, explanation: any;

  const typesByLevel: Record<number, string[]> = {
    1: ['MULT', 'DIV'],
    2: ['MULT', 'DIV', 'POW', 'ZERO'],
    3: ['POW', 'NEG', 'COMB']
  };

  if (forcedType) {
    type = forcedType;
  } else {
    const l = level > 3 ? 3 : level;
    const availableTypes = typesByLevel[l] || typesByLevel[1];
    type = availableTypes[randomInt(0, availableTypes.length - 1)];
  }
  
  base = randomInt(2, 5);

  switch (type) {
    case 'MULT':
      exp1 = randomInt(2, 5);
      exp2 = randomInt(2, 5);
      correctAnswer = { base, exp: exp1 + exp2 };
      layout = { format: 'inline', parts: [{ b: base, e: exp1 }, '·', { b: base, e: exp2 }] };
      options = [
        correctAnswer,
        { base, exp: exp1 * exp2 },
        { base: base * base, exp: exp1 + exp2 },
        { base, exp: Math.abs(exp1 - exp2) }
      ];
      explanation = {
        text: `Al multiplicar potencias de igual base, conservamos la base (${base}) y sumamos los exponentes (${exp1} + ${exp2} = ${exp1 + exp2}).`,
        animType: 'merge',
        val1: exp1,
        val2: exp2
      };
      break;

    case 'DIV':
      exp2 = randomInt(2, 4);
      exp1 = exp2 + randomInt(1, 4);
      correctAnswer = { base, exp: exp1 - exp2 };
      layout = { format: 'fraction', top: [{ b: base, e: exp1 }], bottom: [{ b: base, e: exp2 }] };
      options = [
        correctAnswer,
        { base, exp: exp1 + exp2 },
        { base: 1, exp: exp1 - exp2 },
        { base, exp: exp1 * exp2 }
      ];
      explanation = {
        text: `Al dividir potencias de igual base, conservamos la base (${base}) y restamos los exponentes (${exp1} - ${exp2} = ${exp1 - exp2}).`,
        animType: 'cancel',
        val1: exp1,
        val2: exp2
      };
      break;

    case 'POW':
      exp1 = randomInt(2, 4);
      exp2 = randomInt(2, 4);
      correctAnswer = { base, exp: exp1 * exp2 };
      layout = { format: 'parenthesis', inner: { b: base, e: exp1 }, outerExp: exp2 };
      options = [
        correctAnswer,
        { base, exp: exp1 + exp2 },
        { base: base * exp2, exp: exp1 },
        { base: base, exp: Math.pow(exp1, exp2) }
      ];
      explanation = {
        text: `En potencia de una potencia, se conserva la base (${base}) y se multiplican los exponentes (${exp1} × ${exp2} = ${exp1 * exp2}).`,
        animType: 'expand',
        val1: exp1,
        val2: exp2
      };
      break;

    case 'ZERO':
      exp1 = randomInt(3, 9);
      correctAnswer = { isNumber: true, value: 1 };
      layout = { format: 'inline', parts: [{ b: base, e: 0 }] };
      options = [
        correctAnswer,
        { isNumber: true, value: 0 },
        { isNumber: true, value: base },
        { base, exp: 1 }
      ];
      explanation = {
        text: `Toda potencia con base distinta de cero elevada al exponente 0 es igual a 1. Imagina que es un número dividido por sí mismo.`,
        animType: 'fadeToOne'
      };
      break;

    case 'NEG':
      exp1 = randomInt(2, 4);
      correctAnswer = { format: 'fraction', top: { isNumber: true, value: 1 }, bottom: { b: base, e: exp1 } };
      layout = { format: 'inline', parts: [{ b: base, e: -exp1 }] };
      options = [
        correctAnswer,
        { format: 'fraction', top: { isNumber: true, value: 1 }, bottom: { b: base, e: -exp1 } },
        { base: -base, exp: exp1 },
        { isNumber: true, value: -Math.pow(base, exp1) }
      ];
      explanation = {
        text: `Un exponente negativo indica el inverso multiplicativo de la base. Se invierte la base y el exponente queda positivo.`,
        animType: 'flip'
      };
      break;

    case 'COMB':
    default:
      exp1 = randomInt(2, 5);
      exp2 = randomInt(2, 5);
      exp3 = randomInt(2, 5);
      const topSum = exp1 + exp2;
      let finalExp = topSum - exp3;
      
      if (finalExp === 0) finalExp = 1;

      correctAnswer = { base, exp: finalExp };
      layout = { 
        format: 'fraction', 
        top: [{ b: base, e: exp1 }, '·', { b: base, e: exp2 }], 
        bottom: [{ b: base, e: exp3 }] 
      };
      options = [
        correctAnswer,
        { base, exp: (exp1 * exp2) - exp3 },
        { base, exp: topSum + exp3 },
        { base, exp: Math.abs(exp1 - exp2) + exp3 }
      ];
      explanation = {
        text: `Primero resolvemos el numerador sumando exponentes (${exp1}+${exp2}=${topSum}). Luego dividimos restando el exponente del denominador (${topSum}-${exp3}=${finalExp}).`,
        animType: 'sequence',
        val1: exp1, val2: exp2, val3: exp3
      };
      break;
  }

  const uniqueOptions: any[] = [];
  const serializedOptions = new Set();
  
  for (const opt of options) {
    const str = JSON.stringify(opt);
    if (!serializedOptions.has(str)) {
      serializedOptions.add(str);
      uniqueOptions.push(opt);
    }
  }

  while(uniqueOptions.length < 4) {
     const dummyOpt = { base, exp: randomInt(1, 15) };
     if (!serializedOptions.has(JSON.stringify(dummyOpt))) {
       uniqueOptions.push(dummyOpt);
       serializedOptions.add(JSON.stringify(dummyOpt));
     }
  }

  return {
    id: Math.random().toString(36).substr(2, 9),
    type: PROP_TYPES[type as keyof typeof PROP_TYPES] || 'Combinado',
    rawType: type,
    base,
    layout,
    correctAnswer,
    options: shuffleArray(uniqueOptions),
    explanation
  };
};

// --- COMPONENTES VISUALES MATEMÁTICOS ---
const MathPower = ({ base, exp, isNumber, value }: any) => {
  if (isNumber) return <span className="font-bold text-2xl">{value}</span>;
  return (
    <span className="inline-flex items-baseline font-bold text-2xl mx-1">
      {base}<sup className="text-sm -top-3 left-0.5 text-emerald-400">{exp}</sup>
    </span>
  );
};

const MathRenderer = ({ layout, answerFormat }: any) => {
  if (answerFormat) {
     if (layout.isNumber) return <span className="text-xl font-bold">{layout.value}</span>;
     if (layout.format === 'fraction') {
       return (
         <div className="inline-flex flex-col items-center mx-2 align-middle">
           <div className="border-b-2 border-slate-400 px-2 pb-1">
             <MathPower {...layout.top} />
           </div>
           <div className="px-2 pt-1">
             <MathPower {...layout.bottom} />
           </div>
         </div>
       );
     }
     return <MathPower base={layout.base} exp={layout.exp} />;
  }

  if (layout.format === 'inline') {
    return (
      <div className="flex items-center justify-center space-x-2 text-3xl">
        {layout.parts.map((part: any, i: number) => 
          typeof part === 'string' ? 
            <span key={i} className="text-slate-400 font-bold px-2">{part}</span> : 
            <MathPower key={i} base={part.b} exp={part.e} />
        )}
      </div>
    );
  }

  if (layout.format === 'fraction') {
    return (
      <div className="flex flex-col items-center justify-center text-3xl">
        <div className="flex items-center space-x-2 border-b-4 border-slate-500 pb-2 px-4 mb-2">
          {layout.top.map((part: any, i: number) => 
            typeof part === 'string' ? 
              <span key={i} className="text-slate-400 font-bold px-2">{part}</span> : 
              <MathPower key={i} base={part.b} exp={part.e} />
          )}
        </div>
        <div className="flex items-center space-x-2">
          {layout.bottom.map((part: any, i: number) => 
            typeof part === 'string' ? 
              <span key={i} className="text-slate-400 font-bold px-2">{part}</span> : 
              <MathPower key={i} base={part.b} exp={part.e} />
          )}
        </div>
      </div>
    );
  }

  if (layout.format === 'parenthesis') {
    return (
      <div className="flex items-center justify-center text-3xl">
        <span className="text-slate-400 text-4xl font-light">(</span>
        <MathPower base={layout.inner.b} exp={layout.inner.e} />
        <span className="text-slate-400 text-4xl font-light">)</span>
        <sup className="text-xl -top-6 text-emerald-400 font-bold">{layout.outerExp}</sup>
      </div>
    );
  }

  return null;
};

// --- COMPONENTE DE ANIMACIÓN DIDÁCTICA ---
const ConceptVisualizer = ({ problem, isVisible }: any) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setStep(0);
      return;
    }
    const timer = setInterval(() => {
      setStep(s => (s + 1) % 3);
    }, 2500);
    return () => clearInterval(timer);
  }, [isVisible]);

  if (!isVisible || !problem || !problem.explanation) return null;

  const { animType, val1, val2, text } = problem.explanation;
  const base = problem.base;

  const renderBlocks = (count: number, colorClass: string) => (
    <div className="flex flex-wrap gap-1 justify-center">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`w-8 h-8 rounded ${colorClass} flex items-center justify-center font-bold text-white shadow-lg animate-pulse`}>
          {base}
        </div>
      ))}
    </div>
  );

  return (
    <div className="mt-6 p-4 bg-slate-800/80 rounded-xl border border-indigo-500/30 w-full animate-fade-in transition-all">
      <h3 className="text-indigo-300 font-semibold mb-4 flex items-center gap-2">
        <Brain className="w-5 h-5" /> Comprende el concepto
      </h3>
      
      <div className="min-h-[120px] flex flex-col items-center justify-center bg-slate-900/50 rounded-lg p-4 mb-4 overflow-hidden relative">
        {animType === 'merge' && (
          <div className="flex items-center gap-4 transition-all duration-1000">
            {step === 0 && (
              <>
                {renderBlocks(val1, 'bg-blue-500')}
                <span className="text-2xl font-bold text-slate-400">+</span>
                {renderBlocks(val2, 'bg-purple-500')}
              </>
            )}
            {step === 1 && (
              <div className="flex gap-2">
                <span className="text-slate-400">Total de bases multiplicadas:</span>
              </div>
            )}
            {step === 2 && renderBlocks(val1 + val2, 'bg-emerald-500')}
          </div>
        )}

        {animType === 'cancel' && (
          <div className="flex flex-col items-center gap-2 transition-all duration-1000">
             {step === 0 && (
               <>
                 <div className="border-b-2 border-slate-600 pb-2">{renderBlocks(val1, 'bg-blue-500')}</div>
                 <div className="pt-2">{renderBlocks(val2, 'bg-red-500')}</div>
               </>
             )}
             {step === 1 && <span className="text-slate-400 text-center text-sm">Se cancelan {val2} pares...</span>}
             {step === 2 && renderBlocks(val1 - val2, 'bg-emerald-500')}
          </div>
        )}

        {animType === 'expand' && (
          <div className="flex flex-col gap-2 items-center transition-all duration-1000">
            {step === 0 && (
              <div className="flex gap-4">
                {Array.from({ length: val2 }).map((_, i) => (
                  <div key={i} className="p-2 border-2 border-dashed border-indigo-500/50 rounded-lg">
                    {renderBlocks(val1, 'bg-purple-500')}
                  </div>
                ))}
              </div>
            )}
            {step === 1 && <span className="text-slate-400">{val2} grupos de {val1}...</span>}
            {step === 2 && renderBlocks(val1 * val2, 'bg-emerald-500')}
          </div>
        )}

        {['fadeToOne', 'flip', 'sequence'].includes(animType) && (
           <div className="text-center text-xl text-emerald-400 font-bold italic animate-bounce">
              {animType === 'fadeToOne' ? "¡Cualquier cantidad dividida por sí misma es 1!" :
               animType === 'flip' ? "¡El signo negativo empuja la base al denominador!" :
               "¡Paso a paso! Resuelve arriba primero, luego divide."}
           </div>
        )}
      </div>
      <p className="text-sm text-slate-300 leading-relaxed text-center">{text}</p>
    </div>
  );
};

// --- APLICACIÓN PRINCIPAL ---
export function PowersLabGame() {
  const { user, addXp, updateSkills } = useUser();
  const navigate = useNavigate();
  
  // Utilizar el nivel del usuario para destrabar problemas
  const level = user ? Math.min(4, user.level) : 1;
  const xp = user?.xp || 0;

  const [streak, setStreak] = useState(0);
  const [problem, setProblem] = useState<any>(null);
  const [feedback, setFeedback] = useState<any>(null);
  const [showVisual, setShowVisual] = useState(false);
  
  const [view, setView] = useState<'game' | 'stats' | 'training' | 'arena'>('game'); 
  const [trainingMode, setTrainingMode] = useState<string | null>(null);
  
  const [stats, setStats] = useState<Record<string, {correct: number, total: number}>>({
    MULT: { correct: 0, total: 0 },
    DIV: { correct: 0, total: 0 },
    POW: { correct: 0, total: 0 },
    ZERO: { correct: 0, total: 0 },
    NEG: { correct: 0, total: 0 },
    COMB: { correct: 0, total: 0 }
  });

  useEffect(() => {
    if (view === 'game') {
      setProblem(generateProblem(level));
    } else if (view === 'training' && trainingMode) {
      setProblem(generateProblem(level, trainingMode));
    } else if (view === 'arena') {
      setProblem(generateProblem(level, 'COMB'));
    }
  }, [level, view, trainingMode]);

  const handleAnswer = (selectedOption: any) => {
    if (feedback) return;

    const isCorrect = JSON.stringify(selectedOption) === JSON.stringify(problem.correctAnswer);
    
    const newStats: Record<string, {correct: number, total: number}> = {
      ...stats,
      [problem.rawType]: {
        correct: stats[problem.rawType].correct + (isCorrect ? 1 : 0),
        total: stats[problem.rawType].total + 1
      }
    };
    
    setStats(newStats);
    
    // Convertir el formato local al formato esperado por el Radar (Módulo II - Propiedades)
    const globalSkillsUpdate: Record<string, {correct: number, total: number}> = {};
    Object.keys(newStats).forEach(key => {
      // Prefijamos la clave para que se vean organizadas en el radar
      const tag = `Lab Potencias: ${(PROP_TYPES as any)[key] || key}`;
      globalSkillsUpdate[tag] = newStats[key];
    });
    // Envía los datos actualizados a Firebase
    updateSkills(globalSkillsUpdate);

    if (isCorrect) {
      let baseXP = view === 'arena' ? 20 : 10;
      const earnedXp = baseXP + (streak * 2);
      
      addXp(earnedXp); // Añade el XP Global!
      setStreak(s => s + 1);
      setFeedback({ isCorrect: true, message: `¡Excelente! +${earnedXp} XP` });
    } else {
      setStreak(0);
      setFeedback({ isCorrect: false, message: '¡Casi! Revisa la propiedad y la visualización.' });
      setShowVisual(true);
    }
  };

  const nextProblem = () => {
    setFeedback(null);
    setShowVisual(false);
    if (view === 'game') setProblem(generateProblem(level));
    else if (view === 'training') setProblem(generateProblem(level, trainingMode));
    else if (view === 'arena') setProblem(generateProblem(level, 'COMB'));
  };

  const calculateAccuracy = (correct: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((correct / total) * 100);
  };

  const progressPercent = (xp % 1000) / 1000 * 100;
  const xpToNext = 1000 - (xp % 1000);

  const navigateTo = (newView: typeof view, mode: string | null = null) => {
    setView(newView);
    setTrainingMode(mode);
    setFeedback(null);
    setShowVisual(false);
  };

  if (!problem && view !== 'stats' && view !== 'training' && view !== 'arena') {
    return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Cargando Laboratorio...</div>;
  }

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 overflow-x-hidden relative flex flex-col m-0 p-0 absolute inset-0 z-50">
      {/* Background Decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px]"></div>
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] rounded-full bg-purple-900/20 blur-[100px]"></div>
      </div>

      {/* HEADER / NAVBAR */}
      <header className="relative z-10 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 w-full">
        <div className="max-w-4xl mx-auto p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-2 mr-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-2 transition-colors border border-slate-700"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline font-medium">Volver</span>
            </button>
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg shadow-lg shadow-indigo-500/20 hidden sm:block">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold hidden md:block tracking-wide">
              Lab. <span className="text-indigo-400">Potencias</span>
            </h1>
          </div>
          
          <div className="flex gap-2 sm:gap-4 items-center">
            <button onClick={() => navigateTo('game')} className={`p-2 rounded-lg transition-colors ${view === 'game' ? 'bg-indigo-600/30 text-indigo-400' : 'hover:bg-slate-800 text-slate-400'}`} title="Modo Aventura">
              <Play className="w-5 h-5" />
            </button>
            <button onClick={() => navigateTo('training')} className={`p-2 rounded-lg transition-colors ${view === 'training' ? 'bg-indigo-600/30 text-indigo-400' : 'hover:bg-slate-800 text-slate-400'}`} title="Entrenamiento">
              <Target className="w-5 h-5" />
            </button>
            <button onClick={() => navigateTo('arena')} className={`p-2 rounded-lg transition-colors ${view === 'arena' ? 'bg-rose-600/30 text-rose-400' : 'hover:bg-slate-800 text-slate-400'}`} title="Arena de Combinados">
              <Swords className="w-5 h-5" />
            </button>
            <button onClick={() => navigateTo('stats')} className={`p-2 rounded-lg transition-colors ${view === 'stats' ? 'bg-indigo-600/30 text-indigo-400' : 'hover:bg-slate-800 text-slate-400'}`} title="Estadísticas Local">
              <BarChart2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BARRA DE PROGRESO DE NIVEL */}
        <div className="bg-slate-800 border-t border-slate-700 px-4 py-2 w-full">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-4 justify-between text-sm">
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Shield className={`w-5 h-5 ${level >= 3 ? 'text-amber-400' : level === 2 ? 'text-blue-400' : 'text-slate-400'}`} />
                <span className="font-bold">Nv. {level}</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Trophy className="w-4 h-4" /> {xp} XP
              </div>
              <div className="flex items-center gap-2" title="Racha">
                <Activity className={`w-4 h-4 ${streak > 2 ? 'text-orange-500 animate-pulse' : 'text-slate-500'}`} />
                <span className="font-bold text-slate-300">{streak}</span>
              </div>
            </div>

            <div className="w-full sm:w-1/2 flex items-center gap-3">
              <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden ring-1 ring-slate-700">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out relative"
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
              <span className="text-xs text-slate-400 whitespace-nowrap font-medium min-w-[100px]">
                Faltan {xpToNext} XP
              </span>
            </div>

          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="relative z-10 flex-grow w-full max-w-4xl mx-auto p-4 sm:p-6 flex flex-col items-center justify-center">
        
        {/* --- VISTA: MODO AVENTURA / TRAINING ESPECÍFICO / ARENA --- */}
        {(view === 'game' || (view === 'training' && trainingMode) || view === 'arena') && problem && (
          <div className="w-full max-w-2xl animate-fade-in-up">
            
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <div className="flex flex-col">
                {view === 'arena' && (
                  <span className="text-rose-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Swords className="w-3 h-3" /> Arena de Desafío
                  </span>
                )}
                {view === 'training' && (
                  <span className="text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Target className="w-3 h-3" /> Práctica Aislada
                  </span>
                )}
                <span className="text-sm font-medium tracking-widest uppercase text-slate-300 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700">
                  {problem.type}
                </span>
              </div>
              
              <button 
                onClick={() => setShowVisual(!showVisual)}
                className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg transition-all font-medium ${
                  showVisual ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 shadow-lg'
                }`}
              >
                <Star className="w-4 h-4" />
                {showVisual ? 'Ocultar Concepto' : 'Animar Concepto'}
              </button>
            </div>

            <ConceptVisualizer problem={problem} isVisible={showVisual} />

            <div className={`backdrop-blur-sm border rounded-3xl p-8 sm:p-12 mb-8 shadow-2xl flex justify-center items-center min-h-[200px] mt-6 transition-colors duration-500 ${
              view === 'arena' ? 'bg-rose-900/20 border-rose-500/30 shadow-rose-900/20' : 'bg-slate-800/60 border-slate-700'
            }`}>
              <MathRenderer layout={problem.layout} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {problem.options.map((opt: any, idx: number) => {
                let statusClasses = "bg-slate-800 border-slate-700 hover:bg-indigo-600 hover:border-indigo-500 shadow-lg";
                let isCurrentCorrect = JSON.stringify(opt) === JSON.stringify(problem.correctAnswer);
                
                if (feedback) {
                  if (isCurrentCorrect) {
                    statusClasses = "bg-emerald-600/20 border-emerald-500 text-emerald-100 ring-2 ring-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]";
                  } else {
                    statusClasses = "bg-slate-900/50 border-slate-800 opacity-50 cursor-not-allowed";
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(opt)}
                    disabled={feedback !== null}
                    className={`relative p-6 rounded-2xl border-2 flex justify-center items-center transition-all duration-300 ${statusClasses} group overflow-hidden`}
                  >
                    {!feedback && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                    )}
                    <MathRenderer layout={opt} answerFormat={true} />
                  </button>
                );
              })}
            </div>

            {feedback && (
              <div className={`mt-8 p-5 rounded-xl flex items-center justify-between border ${
                feedback.isCorrect ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-200 shadow-lg shadow-emerald-900/20' : 'bg-rose-900/30 border-rose-500/50 text-rose-200 shadow-lg shadow-rose-900/20'
              } animate-bounce-in`}>
                <div className="flex items-center gap-3">
                  {feedback.isCorrect ? <CheckCircle className="w-7 h-7 text-emerald-400" /> : <XCircle className="w-7 h-7 text-rose-400" />}
                  <span className="font-bold text-lg">{feedback.message}</span>
                </div>
                <button 
                  onClick={nextProblem}
                  className="bg-slate-950/50 hover:bg-slate-950 px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all border border-transparent hover:border-slate-600 shadow-md hover:shadow-xl"
                >
                  Siguiente <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- VISTA: MENÚ DE ENTRENAMIENTO --- */}
        {view === 'training' && !trainingMode && (
          <div className="w-full max-w-3xl animate-fade-in-up">
            <div className="text-center mb-10">
              <Target className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-2">Campo de Entrenamiento</h2>
              <p className="text-slate-400">Selecciona una propiedad específica para practicarla de forma aislada. Ideal para reforzar conceptos donde tienes menor precisión.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(PROP_TYPES).filter(([k]) => k !== 'COMB').map(([key, title]) => (
                <button 
                  key={key}
                  onClick={() => navigateTo('training', key)}
                  className="flex items-center justify-between p-6 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-indigo-500/50 rounded-2xl transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-900 rounded-lg group-hover:bg-indigo-600/20 transition-colors">
                      <Crosshair className="w-6 h-6 text-indigo-400" />
                    </div>
                    <span className="font-semibold text-lg text-left">{title}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --- VISTA DE ESTADÍSTICAS --- */}
        {view === 'stats' && (
          <div className="w-full max-w-2xl bg-slate-800/80 backdrop-blur border border-slate-700 rounded-3xl p-6 sm:p-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-700">
              <Activity className="w-8 h-8 text-indigo-400" />
              <h2 className="text-2xl font-bold">Diagnóstico de Habilidades (Local)</h2>
            </div>

            <div className="space-y-6">
              {Object.entries(stats).map(([type, data]) => {
                const acc = calculateAccuracy(data.correct, data.total);
                
                return (
                  <div key={type} className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-slate-300 flex items-center gap-2">
                        {type === 'COMB' && <Swords className="w-4 h-4 text-rose-400" />}
                        {(PROP_TYPES as any)[type as string]}
                      </span>
                      <span className={`font-bold ${acc >= 80 ? 'text-emerald-400' : acc >= 50 ? 'text-amber-400' : data.total > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                        {data.total > 0 ? `${acc}%` : 'Sin datos'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          acc >= 80 ? 'bg-emerald-500' : acc >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${acc}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="text-xs text-slate-500">
                        {data.correct} correctas de {data.total}
                      </div>
                      {data.total > 0 && acc < 60 && type !== 'COMB' && (
                         <button 
                           onClick={() => navigateTo('training', type)}
                           className="text-xs bg-indigo-900/30 text-indigo-300 px-2 py-1 rounded hover:bg-indigo-800/50 transition-colors"
                         >
                           Practicar esto
                         </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 bg-indigo-900/20 border border-indigo-500/20 p-4 rounded-xl flex items-start gap-3">
              <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-slate-300">
                La barra de progreso superior te indica tu avance. Al llegar a nuevos niveles (Nv. 2 y Nv. 3) se desbloquean propiedades más difíciles automáticamente en el Modo Aventura. Usa la Arena para el desafío definitivo.
              </p>
            </div>
          </div>
        )}

      </main>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }
        @keyframes bounce-in {
          0% { opacity: 0; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.02); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-bounce-in {
          animation: bounce-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-in forwards;
        }
      `}} />
    </div>
  );
}
