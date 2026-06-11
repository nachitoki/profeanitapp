import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, BookOpen, Layers, Activity, CheckCircle2, XCircle, Bot, Play, RefreshCcw } from 'lucide-react';
import { useUser } from '../App';
import confetti from 'canvas-confetti';

const THEME = {
  bg: 'bg-slate-950',
  panel: 'bg-slate-900',
  card: 'bg-slate-800',
  text: 'text-slate-100',
  accent: 'text-indigo-400',
  accentBg: 'bg-indigo-600',
};

// --- COMPONENTE DE FRACCIÓN VERTICAL ---
const Fraction = ({ num, den, size = 'text-base' }: any) => (
  <span className={`inline-flex flex-col items-center justify-center align-middle mx-1 ${size} leading-none`}>
    <span>{num}</span>
    <span className="border-t-[1.5px] border-current w-full my-[2px]"></span>
    <span>{den}</span>
  </span>
);

// --- FORMATEADOR DE TEXTO (Para opciones matemáticas) ---
const FormatMath = ({ text }: { text: string }) => {
  if (typeof text !== 'string') return text;
  if (text.includes('/')) {
    const [n, d] = text.split('/');
    return <Fraction num={n} den={d} />;
  }
  if (text.includes('^')) {
    const [b, e] = text.split('^');
    return <span>{b}<sup className="text-[0.7em] ml-[1px]">{e}</sup></span>;
  }
  return <span>{text}</span>;
};

// --- BASE DE DATOS DE PROPIEDADES (Con JSX) ---
const PROPERTIES = [
  { 
    id: 'mult', title: 'Multiplicación de igual base', 
    rule: <span>a<sup>m</sup> × a<sup>n</sup> = a<sup>m+n</sup></span>, 
    desc: 'Se conserva la base y se suman los exponentes.', 
    example: <span>2<sup>3</sup> × 2<sup>2</sup> = 2<sup>5</sup></span> 
  },
  { 
    id: 'div', title: 'División de igual base', 
    rule: <span className="flex items-center"><Fraction num={<span>a<sup>m</sup></span>} den={<span>a<sup>n</sup></span>} /> <span>= a<sup>m-n</sup></span></span>, 
    desc: 'Se conserva la base y se restan los exponentes.', 
    example: <span className="flex items-center"><Fraction num={<span>5<sup>4</sup></span>} den={<span>5<sup>2</sup></span>} /> <span>= 5<sup>2</sup></span></span> 
  },
  { 
    id: 'pow', title: 'Potencia de una potencia', 
    rule: <span>(a<sup>m</sup>)<sup>n</sup> = a<sup>m×n</sup></span>, 
    desc: 'Se conserva la base y se multiplican los exponentes.', 
    example: <span>(3<sup>2</sup>)<sup>3</sup> = 3<sup>6</sup></span> 
  },
  { 
    id: 'zero', title: 'Exponente Cero', 
    rule: <span>a<sup>0</sup> = 1</span>, 
    desc: 'Cualquier número (distinto de 0) elevado a cero es 1.', 
    example: <span>7<sup>0</sup> = 1</span> 
  },
  { 
    id: 'neg', title: 'Exponente Negativo', 
    rule: <span className="flex items-center">a<sup>-n</sup> = <Fraction num="1" den={<span>a<sup>n</sup></span>} /></span>, 
    desc: 'Se invierte la base y el exponente queda positivo.', 
    example: <span className="flex items-center">2<sup>-3</sup> = <Fraction num="1" den={<span>2<sup>3</sup></span>} /> = <Fraction num="1" den="8" /></span> 
  },
];

// --- GENERADOR DE EJERCICIOS DE PROPIEDADES (Individuales) ---
const generatePropertyExercise = (id: string) => {
  let qJSX, ans = "", opts: string[] = [];
  const base = Math.floor(Math.random() * 5) + 2;

  if (id === 'mult') {
    const e1 = Math.floor(Math.random() * 5) + 2;
    const e2 = Math.floor(Math.random() * 5) + 2;
    qJSX = <span>{base}<sup>{e1}</sup> × {base}<sup>{e2}</sup></span>;
    ans = `${base}^${e1+e2}`;
    opts = [ans, `${base}^${e1*e2}`, `${base*2}^${e1+e2}`, `${base}^${Math.abs(e1-e2)}`];
  } else if (id === 'div') {
    const e1 = Math.floor(Math.random() * 5) + 5;
    const e2 = Math.floor(Math.random() * 4) + 1;
    qJSX = <Fraction num={<span>{base}<sup>{e1}</sup></span>} den={<span>{base}<sup>{e2}</sup></span>} size="text-2xl" />;
    ans = `${base}^${e1-e2}`;
    opts = [ans, `${base}^${e1+e2}`, `1^${e1-e2}`, `${base}^${Math.floor(e1/e2)}`];
  } else if (id === 'pow') {
    const e1 = Math.floor(Math.random() * 4) + 2;
    const e2 = Math.floor(Math.random() * 4) + 2;
    qJSX = <span>({base}<sup>{e1}</sup>)<sup>{e2}</sup></span>;
    ans = `${base}^${e1*e2}`;
    opts = [ans, `${base}^${e1+e2}`, `${base*e2}^${e1}`, `${base}^${Math.pow(e1,e2)}`];
  } else if (id === 'zero') {
    const b = Math.floor(Math.random() * 100) + 5;
    qJSX = <span>{b}<sup>0</sup></span>;
    ans = "1";
    opts = ["1", "0", b.toString(), "10"];
  } else if (id === 'neg') {
    const b = Math.floor(Math.random() * 4) + 2;
    const e = Math.floor(Math.random() * 3) + 1;
    qJSX = <span>{b}<sup>-{e}</sup></span>;
    ans = `1/${Math.pow(b, e)}`;
    opts = [ans, `-${Math.pow(b,e)}`, `1/${b*e}`, `-${b*e}`];
  }

  let uniqueOpts = [...new Set(opts)];
  while(uniqueOpts.length < 4) {
      uniqueOpts.push(`${Math.floor(Math.random() * 10) + 1}^${Math.floor(Math.random() * 10)}`);
      uniqueOpts = [...new Set(uniqueOpts)];
  }
  return { question: qJSX, answer: ans, options: uniqueOpts.sort(() => Math.random() - 0.5) };
};

// --- GENERADOR DE EJERCICIOS GENERALES ---
const generateExercise = (level: string) => {
  let qJSX, answer = "", options: string[] = [];

  if (level === 'basics') {
    const base = Math.floor(Math.random() * 9) + 2;
    const exp = Math.floor(Math.random() * 4) + 1;
    qJSX = <span>{base}<sup>{exp}</sup></span>;
    answer = Math.pow(base, exp).toString();
    options = [
      answer,
      (base * exp).toString(),
      Math.pow(base, exp === 1 ? 2 : exp - 1).toString(),
      Math.pow(exp, base > 4 ? 2 : base).toString()
    ];
  } 
  else if (level === 'fractions') {
    const num = Math.floor(Math.random() * 4) + 1;
    const den = Math.floor(Math.random() * 4) + 2;
    const exp = Math.floor(Math.random() * 3) + 1;
    qJSX = <span>(<Fraction num={num} den={den} size="text-5xl" />)<sup>{exp}</sup></span>;
    answer = `${Math.pow(num, exp)}/${Math.pow(den, exp)}`;
    options = [
      answer,
      `${num * exp}/${den * exp}`,
      `${Math.pow(den, exp)}/${Math.pow(num, exp)}`,
      `${Math.pow(num, exp)}/${den}`
    ];
  }
  else if (level === 'properties') {
    const props = ['mult', 'div', 'pow', 'zero', 'neg'];
    const p = props[Math.floor(Math.random() * props.length)];
    const ex = generatePropertyExercise(p);
    qJSX = ex.question;
    answer = ex.answer;
    options = ex.options;
  }

  let uniqueOpts = [...new Set(options)];
  while(uniqueOpts.length < 4) {
      if (level === 'basics') uniqueOpts.push((parseInt(answer) + Math.floor(Math.random() * 10) + 1).toString());
      else if (level === 'fractions') uniqueOpts.push(`${Math.floor(Math.random()*10)+1}/${Math.floor(Math.random()*10)+2}`);
      else uniqueOpts.push(`2^${Math.floor(Math.random()*20)}`);
      uniqueOpts = [...new Set(uniqueOpts)];
  }
  return { question: qJSX, answer: answer, options: uniqueOpts.sort(() => Math.random() - 0.5) };
};

// --- COMPONENTE TARJETA DE PROPIEDAD INTERACTIVA ---
const PropertyCard = ({ prop, onCorrect }: { prop: any, onCorrect: () => void }) => {
  const [exercise, setExercise] = useState<any>(null);
  const [feedback, setFeedback] = useState<string | null>(null); // 'correct' | 'incorrect'
  const [selected, setSelected] = useState<string | null>(null);

  const startExercise = () => {
    setExercise(generatePropertyExercise(prop.id));
    setFeedback(null);
    setSelected(null);
  };

  const handleAnswer = (opt: string) => {
    if (feedback) return;
    setSelected(opt);
    if (opt === exercise.answer) {
      setFeedback('correct');
      onCorrect();
      setTimeout(startExercise, 1200); // Siguiente automático rápido
    } else {
      setFeedback('incorrect');
    }
  };

  return (
    <div className={`${THEME.card} p-6 rounded-2xl border border-slate-700 shadow-lg flex flex-col`}>
      <div className="flex-1">
        <h3 className="text-xl font-bold text-white mb-2">{prop.title}</h3>
        <p className="text-sm text-slate-400 mb-6 h-10">{prop.desc}</p>
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 flex flex-col space-y-3 mb-4">
          <div className="flex items-center space-x-2">
             <span className="text-xs font-bold text-slate-500 uppercase">Regla:</span>
             <span className="text-indigo-400 font-bold text-lg">{prop.rule}</span>
          </div>
          <div className="flex items-center space-x-2">
             <span className="text-xs font-bold text-slate-500 uppercase">Ej:</span>
             <span className="text-emerald-400 text-base">{prop.example}</span>
          </div>
        </div>
      </div>

      {/* Zona Interactiva */}
      {exercise ? (
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-700 animate-in fade-in zoom-in duration-300">
          <div className="text-center font-bold text-2xl text-white mb-4 flex items-center justify-center space-x-2">
             {exercise.question} <span>= ?</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {exercise.options.map((opt: string, i: number) => {
              let btnClass = "bg-slate-800 border-slate-600 text-white hover:bg-slate-700";
              if (feedback) {
                if (opt === exercise.answer) btnClass = "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]";
                else if (opt === selected) btnClass = "bg-rose-500/20 border-rose-500 text-rose-500";
                else btnClass = "bg-slate-800 border-slate-700 text-slate-600 opacity-50";
              }
              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(opt)}
                  disabled={feedback !== null}
                  className={`p-3 rounded-lg border-2 font-black text-xl transition-all font-mono flex items-center justify-center ${btnClass}`}
                >
                  <FormatMath text={opt} />
                </button>
              );
            })}
          </div>
          {feedback === 'correct' && <div className="text-center text-emerald-400 text-sm font-bold mt-3 animate-bounce">¡Correcto! +XP</div>}
          {feedback === 'incorrect' && (
            <button onClick={startExercise} className="mt-3 w-full text-slate-400 hover:text-white text-sm font-bold flex items-center justify-center space-x-1">
              <RefreshCcw className="w-4 h-4" /> <span>Intentar de nuevo</span>
            </button>
          )}
        </div>
      ) : (
        <button 
          onClick={startExercise} 
          className="w-full py-3 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/50 rounded-xl text-sm font-bold text-indigo-300 transition-colors flex items-center justify-center space-x-2"
        >
          <Play className="w-4 h-4" /> <span>Entrenar esta propiedad</span>
        </button>
      )}
    </div>
  );
};


export default function PowersBotGame({ moduleData }: { moduleData: any }) {
  const [activeTab, setActiveTab] = useState('concept'); // concept, properties, practice
  const { addXp, addCoins, markModuleCompleted } = useUser();
  const navigate = useNavigate();

  const isInfinite = moduleData?.isInfinite === true;
  const maxQuestions = 10;
  
  // Estado para Simulador
  const [simBase, setSimBase] = useState(2);
  const [simExp, setSimExp] = useState(3);
  
  // Estado para Práctica General
  const [practiceLevel, setPracticeLevel] = useState('basics'); // basics, fractions, properties
  const [currentQ, setCurrentQ] = useState<any>(null);
  
  // Reemplazamos score por qIndex para misiones, aunque usaremos score visualmente
  const [qIndex, setQIndex] = useState(0); 
  const [score, setScore] = useState(0); // Puntos visuales
  const [feedback, setFeedback] = useState<{status: string, selected: string} | null>(null);

  // Iniciar nueva pregunta al cambiar de nivel en práctica general
  useEffect(() => {
    if (activeTab === 'practice') {
      setCurrentQ(generateExercise(practiceLevel));
      setFeedback(null);
    }
  }, [practiceLevel, activeTab]);

  const handleCorrectProperty = () => {
    addXp(10);
    addCoins(2);
  };

  const handleGeneralAnswer = (opt: string) => {
    if (feedback) return;
    const isCorrect = opt === currentQ.answer;
    setFeedback({ status: isCorrect ? 'correct' : 'incorrect', selected: opt });
    
    if (isCorrect) {
      setScore(s => s + 10);
      setQIndex(q => q + 1);
      addXp(10);
      addCoins(2);

      if (!isInfinite && qIndex + 1 >= maxQuestions) {
        // Celebración de fin de misión
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        setTimeout(() => {
          markModuleCompleted(moduleData.id);
          addXp(moduleData.xpReward || 100);
          navigate('/dashboard');
        }, 3000);
        return; // No generar nueva pregunta
      }
    }

    setTimeout(() => {
      setCurrentQ(generateExercise(practiceLevel));
      setFeedback(null);
    }, 1500);
  };

  // --- RENDERIZADO DE PESTAÑAS ---
  const renderConcept = () => {
    const isFraction = simBase < 0; 
    const displayBase = isFraction ? "1/2" : simBase;
    const result = isFraction ? (1 / Math.pow(2, simExp)) : Math.pow(simBase, simExp);
    
    let expansion = "";
    if (simExp === 0) expansion = "1";
    else if (isFraction) expansion = Array(simExp).fill("(1/2)").join(" × ");
    else expansion = Array(simExp).fill(simBase).join(" × ");

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="text-center space-y-4 mb-8">
          <h2 className="text-3xl font-bold text-white">El Concepto Base</h2>
          <p className="text-slate-400">Una potencia es una forma abreviada de escribir una multiplicación repetida.</p>
        </div>

        <div className={`${THEME.card} p-8 rounded-3xl border border-slate-700 flex flex-col items-center justify-center space-y-8 shadow-xl`}>
          <div className="flex items-center justify-center space-x-2 text-white h-32">
            <div className="relative group cursor-pointer flex items-end">
              <span className="text-8xl font-black">{isFraction ? <Fraction num="1" den="2" size="text-6xl" /> : simBase}</span>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-indigo-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">BASE</div>
            </div>
            <div className="relative group cursor-pointer flex items-start h-full pt-2">
              <span className="text-5xl font-bold text-indigo-400">{simExp}</span>
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-indigo-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">EXPONENTE</div>
            </div>
            <span className="text-6xl font-bold text-slate-600 mx-4">=</span>
            <span className="text-8xl font-black text-emerald-400 flex items-center">
               {isFraction ? <Fraction num="1" den={Math.pow(2, simExp)} size="text-6xl" /> : result}
            </span>
          </div>

          <div className="w-full max-w-lg bg-slate-900 rounded-xl p-4 text-center border border-slate-700 mt-8 overflow-hidden">
            <span className="text-slate-400 text-sm uppercase font-bold tracking-wider block mb-2">Desarrollo</span>
            <span className="text-2xl font-mono text-cyan-300 tracking-widest break-words block w-full">{expansion}</span>
          </div>

          <div className="w-full max-w-md space-y-6 pt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-bold text-slate-400">
                <span>Base (El número que se multiplica)</span>
                <span className="text-white">{displayBase}</span>
              </div>
              <input 
                type="range" min="-1" max="10" 
                value={simBase} onChange={(e) => setSimBase(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <p className="text-xs text-slate-500 text-center">Desliza a la izquierda para probar con una fracción.</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-bold text-slate-400">
                <span>Exponente (Las veces que aparece la base)</span>
                <span className="text-indigo-400">{simExp}</span>
              </div>
              <input 
                type="range" min="0" max="5" 
                value={simExp} onChange={(e) => setSimExp(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProperties = () => (
    <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-bold text-white">Leyes del Laboratorio</h2>
        <p className="text-slate-400">Selecciona "Entrenar esta propiedad" para practicarla individualmente.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        {PROPERTIES.map((prop) => (
          <PropertyCard key={prop.id} prop={prop} onCorrect={handleCorrectProperty} />
        ))}
      </div>
    </div>
  );

  const renderPractice = () => {
    if (!currentQ) return null;

    return (
      <div className="flex flex-col items-center w-full max-w-2xl mx-auto animate-in zoom-in-95 duration-500">
        
        {/* Selector de Dificultad */}
        <div className="flex bg-slate-800 p-1.5 rounded-xl mb-4 w-full border border-slate-700 shadow-md">
          {[
            { id: 'basics', label: 'Básicas' },
            { id: 'fractions', label: 'Fracciones' },
            { id: 'properties', label: 'Propiedades Mixtas' }
          ].map(lvl => (
            <button
              key={lvl.id}
              onClick={() => { setPracticeLevel(lvl.id); setQIndex(0); setScore(0); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${practiceLevel === lvl.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
            >
              {lvl.label}
            </button>
          ))}
        </div>

        {/* Marcador e Información de Misión */}
        <div className="w-full flex justify-between items-center mb-2 px-4 text-slate-400 font-bold uppercase tracking-widest text-sm">
          <span>Energía: <span className="text-emerald-400 text-lg">{score}</span></span>
          <div className="flex items-center space-x-4">
            <span className="text-indigo-300">
              {isInfinite ? `Aciertos: ${qIndex}` : `Aciertos: ${qIndex} / ${maxQuestions}`}
            </span>
            <Activity className="text-indigo-500 w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Progress Bar (Misiones Finitas) */}
        {!isInfinite && (
           <div className="w-full bg-slate-800 rounded-full h-2 mb-6 border border-slate-700 overflow-hidden shadow-inner">
             <div 
               className="bg-indigo-500 h-2 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
               style={{ width: `${(qIndex / maxQuestions) * 100}%` }}
             ></div>
           </div>
        )}
        {isInfinite && <div className="mb-6"></div>}

        {/* Tarjeta de Pregunta */}
        <div className={`${THEME.card} w-full p-10 rounded-3xl border-2 border-slate-700 shadow-2xl relative overflow-hidden mb-8 min-h-[250px] flex flex-col justify-center`}>
          {feedback && (
            <div className={`absolute inset-0 z-0 flex items-center justify-center opacity-10 transition-colors duration-300 ${feedback.status === 'correct' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
          )}
          
          <div className="relative z-10 text-center">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-sm mb-6 block">Calcula o simplifica:</span>
            <div className="text-6xl md:text-7xl font-black text-white font-mono flex items-center justify-center">
              {currentQ.question}
            </div>
          </div>
        </div>

        {/* Botones de Alternativas */}
        <div className="grid grid-cols-2 gap-4 w-full">
          {currentQ.options.map((opt: string, i: number) => {
            let btnState = 'bg-slate-800 border-slate-600 hover:border-indigo-400 hover:bg-slate-700 text-white hover:shadow-lg';
            
            if (feedback) {
              if (opt === currentQ.answer) {
                btnState = 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-105 z-10';
              } else if (opt === feedback.selected && feedback.status === 'incorrect') {
                btnState = 'bg-rose-500/20 border-rose-500 text-rose-500 opacity-50 scale-95';
              } else {
                btnState = 'bg-slate-800 border-slate-700 text-slate-600 opacity-30';
              }
            }

            return (
              <button
                key={i}
                onClick={() => handleGeneralAnswer(opt)}
                disabled={feedback !== null}
                className={`h-32 rounded-2xl border-2 font-black text-3xl md:text-4xl transition-all duration-300 font-mono flex items-center justify-center relative overflow-hidden ${btnState}`}
              >
                <FormatMath text={opt} />
                
                {feedback && opt === currentQ.answer && (
                  <CheckCircle2 className="absolute top-3 right-3 w-8 h-8 text-emerald-500 animate-bounce" />
                )}
                {feedback && opt === feedback.selected && feedback.status === 'incorrect' && (
                  <XCircle className="absolute top-3 right-3 w-8 h-8 text-rose-500" />
                )}
              </button>
            );
          })}
        </div>

      </div>
    );
  };

  return (
    <div className={`w-full min-h-screen ${THEME.bg} rounded-xl text-slate-100 font-sans flex flex-col overflow-hidden`}>
      <div className="p-4 md:p-8 flex-1 flex flex-col max-w-6xl mx-auto w-full">
        {/* Cabecera general de la App */}
        <button onClick={() => navigate('/dashboard')} className="btn bg-slate-800 text-white hover:bg-slate-700 border-none self-start mb-6">
          ← Abandonar Misión
        </button>

        {/* Navegación Superior */}
        <header className="w-full mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 p-3 rounded-2xl border border-slate-800 shadow-lg">
            <div className="flex items-center space-x-4 p-4 md:p-2 mb-4 md:mb-0">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl shadow-inner">
                <Bot className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-black italic tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">PotenciasBot</h1>
                {!isInfinite && activeTab !== 'practice' && (
                  <p className="text-xs text-indigo-300 font-bold uppercase mt-1">Completa la "Práctica Final" para superar la misión</p>
                )}
              </div>
            </div>
            
            <div className="flex space-x-2 bg-slate-950 p-1.5 rounded-xl w-full md:w-auto overflow-x-auto no-scrollbar">
              {[
                { id: 'concept', icon: BookOpen, label: 'Concepto' },
                { id: 'properties', icon: Layers, label: 'Propiedades' },
                { id: 'practice', icon: Zap, label: 'Práctica Final' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'bg-slate-800 text-indigo-400 shadow-md border border-slate-700' 
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Contenido Principal */}
        <main className="flex-1 w-full flex flex-col">
          {activeTab === 'concept' && renderConcept()}
          {activeTab === 'properties' && renderProperties()}
          {activeTab === 'practice' && renderPractice()}
        </main>
      </div>
    </div>
  );
}
