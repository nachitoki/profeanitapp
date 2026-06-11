import { useState, useEffect, useRef } from 'react';
import { Trophy, Activity, Target, Shield, Zap } from 'lucide-react';
import { useUser } from '../App';
import { useNavigate } from 'react-router-dom';

const INITIAL_LIVES = 3;
const TIME_PER_QUESTION = 10;

const PenaltyShootout = ({ feedback }: { feedback: string | null }) => {
  const [animState, setAnimState] = useState('idle');

  useEffect(() => {
    if (feedback === 'correct') {
      setAnimState('shooting');
      setTimeout(() => setAnimState('goal'), 100);
    } else if (feedback === 'incorrect') {
      setAnimState('shooting');
      setTimeout(() => setAnimState('saved'), 100);
    } else {
      setAnimState('idle');
    }
  }, [feedback]);

  const ballClass: Record<string, string> = {
    idle: 'bottom-4 left-1/2 -translate-x-1/2',
    shooting: 'bottom-1/2 left-1/2 -translate-x-1/2 scale-50 transition-all duration-500 ease-out',
    goal: 'bottom-[45%] left-[48%] -translate-x-1/2 scale-50 transition-all duration-500 ease-out',
    saved: 'bottom-[40%] left-[40%] -translate-x-1/2 scale-50 transition-all duration-500 ease-out',
  };

  const keeperClass: Record<string, string> = {
    idle: 'bottom-12 left-1/2 -translate-x-1/2',
    shooting: 'bottom-12 left-1/2 -translate-x-1/2',
    goal: 'bottom-12 left-[40%] -translate-x-1/2 -rotate-12 transition-all duration-500 ease-out',
    saved: 'bottom-16 left-[42%] -translate-x-1/2 -rotate-45 transition-all duration-500 ease-out',
  };

  return (
    <div className="relative w-full h-40 mt-4 overflow-hidden border-b-2 border-emerald-500/30">
        <div className="absolute bottom-20 w-full flex justify-center text-7xl opacity-80">🥅</div>
        <div className={`absolute text-5xl z-10 drop-shadow-lg ${keeperClass[animState]}`}>🧤</div>
        <div className={`absolute text-4xl z-20 drop-shadow-xl ${ballClass[animState]}`}>⚽</div>
    </div>
  );
};

const generateOptions = (correctAnswer: number, a: number, b: number, type: string) => {
  const options = new Set<number>();
  options.add(correctAnswer);
  while (options.size < 4) {
    let distractor;
    const randomCase = Math.floor(Math.random() * 4);
    if (type === 'standard') {
      if (randomCase === 0) distractor = (a + 1) * b;
      else if (randomCase === 1) distractor = a * (b + 1);
      else if (randomCase === 2) distractor = (a - 1) * b;
      else distractor = a * b + (Math.random() > 0.5 ? 10 : -10);
    } else {
      distractor = correctAnswer + Math.floor(Math.random() * 5) + 1;
      if (Math.random() > 0.5) distractor = Math.max(1, correctAnswer - Math.floor(Math.random() * 3) - 1);
    }
    if (distractor && distractor > 0 && distractor !== correctAnswer) {
      options.add(distractor);
    }
  }
  return Array.from(options).sort(() => Math.random() - 0.5);
};

const generateQuestion = (mode: string, specificTable: number | null, mastery: Record<string, number>) => {
  let a = 0, b = 0, type = 'standard';
  const types = ['standard', 'missing_factor', 'division'];
  if (mode === 'training') {
    a = specificTable || Math.floor(Math.random() * 10) + 1;
    b = Math.floor(Math.random() * 12) + 1;
  } else if (mode === 'groups') {
    a = Math.floor(Math.random() * 12) + 1;
    b = Math.floor(Math.random() * 12) + 1;
  } else if (mode === 'knockout') {
    a = Math.floor(Math.random() * 10) + 2;
    b = Math.floor(Math.random() * 10) + 2;
    type = types[Math.floor(Math.random() * 2) + 1];
  } else if (mode === 'legend') {
    let weakestFacts: any[] = [];
    let lowestScore = 100;
    for(let i=2; i<=12; i++) {
      for(let j=2; j<=12; j++) {
        const k = `${i}x${j}`;
        const score = mastery[k] || 50;
        if (score < lowestScore) { lowestScore = score; weakestFacts = [[i,j]]; }
        else if (score === lowestScore) { weakestFacts.push([i,j]); }
      }
    }
    if (Math.random() > 0.3 && weakestFacts.length > 0) {
      const selected = weakestFacts[Math.floor(Math.random() * weakestFacts.length)];
      a = selected[0]; b = selected[1];
    } else {
      a = Math.floor(Math.random() * 11) + 2; b = Math.floor(Math.random() * 11) + 2;
    }
    type = types[Math.floor(Math.random() * types.length)];
  }

  let questionText = '';
  let answer = 0;
  const product = a * b;
  if (type === 'standard') { questionText = `${a} × ${b} = ?`; answer = product; }
  else if (type === 'missing_factor') {
    if (Math.random() > 0.5) { questionText = `__ × ${b} = ${product}`; answer = a; }
    else { questionText = `${a} × __ = ${product}`; answer = b; }
  } else if (type === 'division') {
    questionText = `${product} ÷ ${a} = ?`; answer = b;
  }
  return { text: questionText, answer, options: generateOptions(answer, a, b, type), a, b, type, key: `${a}x${b}` };
};

export default function FootballMathGame({ moduleData }: { moduleData: any }) {
  const { addXp, addCoins, markModuleCompleted } = useUser();
  const navigate = useNavigate();

  const [gameState, setGameState] = useState('menu');
  const [gameMode, setGameMode] = useState('groups');
  const [selectedTable, setSelectedTable] = useState(5);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [mastery, setMastery] = useState<Record<string, number>>({});
  const timerRef = useRef<any>(null);

  const startGame = (mode: string) => {
    setGameMode(mode);
    setScore(0);
    setLives(INITIAL_LIVES);
    setStreak(0);
    setGameState('playing');
    setFeedback(null);
    nextQuestion(mode);
  };

  const nextQuestion = (mode = gameMode) => {
    setCurrentQuestion(generateQuestion(mode, selectedTable, mastery));
    setSelectedAnswer(null);
    setFeedback(null);
    setTimeLeft(TIME_PER_QUESTION);
  };

  useEffect(() => {
    if (gameState === 'playing' && feedback === null) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) { handleIncorrect(null, true); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState, currentQuestion, feedback]);

  const handleCorrect = (answerValue: number) => {
    setSelectedAnswer(answerValue);
    setFeedback('correct');
    setScore(s => s + 10 + (streak * 2));
    setStreak(s => s + 1);
    if (currentQuestion) {
      setMastery(prev => ({ ...prev, [currentQuestion.key]: Math.min(100, (prev[currentQuestion.key] || 50) + 15) }));
    }
    setTimeout(() => nextQuestion(), 1200);
  };

  const handleIncorrect = (answerValue: number | null, isTimeout = false) => {
    setSelectedAnswer(answerValue);
    setFeedback('incorrect');
    setStreak(0);
    setLives(l => l - 1);
    if (currentQuestion && !isTimeout) {
      setMastery(prev => ({ ...prev, [currentQuestion.key]: Math.max(0, (prev[currentQuestion.key] || 50) - 20) }));
    }
    if (lives <= 1) {
      setTimeout(() => endGame(), 1200);
    } else {
      setTimeout(() => nextQuestion(), 1200);
    }
  };

  const endGame = () => {
    setGameState('gameover');
  };

  const finishAndSave = () => {
    addXp(score);
    addCoins(Math.floor(score / 5));
    if (moduleData) {
      markModuleCompleted(moduleData.id);
    }
    navigate('/dashboard');
  };

  const handleOptionClick = (optionValue: number) => {
    if (feedback !== null) return;
    if (optionValue === currentQuestion?.answer) handleCorrect(optionValue);
    else handleIncorrect(optionValue);
  };

  const renderMenu = () => (
    <div className="bg-slate-900 text-slate-100 min-h-[80vh] rounded-2xl p-6 shadow-2xl font-sans relative overflow-hidden">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">MathWorldCup '26</h1>
        <p className="text-slate-400 font-medium">Simulador Táctico Oficial</p>
      </div>
      <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
        <button onClick={() => startGame('training')} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-6 rounded-xl text-left transition-all group">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-emerald-400 flex items-center gap-2"><Target size={24}/> Campamento</h3>
            <select onClick={e => e.stopPropagation()} onChange={e => setSelectedTable(Number(e.target.value))} className="bg-slate-900 text-white border border-slate-600 rounded-md px-3 py-1 outline-none focus:border-emerald-500 font-bold cursor-pointer">
              {[...Array(12)].map((_, i) => <option key={i} value={i+1}>{i+1}</option>)}
            </select>
          </div>
          <p className="text-slate-400 text-sm">Práctica enfocada. Selecciona una tabla específica y perfecciona tus pases antes del torneo.</p>
        </button>
        <button onClick={() => startGame('groups')} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-6 rounded-xl text-left transition-all">
          <h3 className="text-xl font-bold text-cyan-400 flex items-center gap-2 mb-4"><Activity size={24}/> Fase de Grupos</h3>
          <p className="text-slate-400 text-sm">Tablas mixtas del 1 al 12. Acción rápida y directa.</p>
        </button>
        <button onClick={() => startGame('knockout')} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-6 rounded-xl text-left transition-all">
          <h3 className="text-xl font-bold text-amber-400 flex items-center gap-2 mb-4"><Zap size={24}/> Octavos de Final</h3>
          <p className="text-slate-400 text-sm">Presión alta. Incluye ejercicios de división y factores faltantes.</p>
        </button>
        <button onClick={() => startGame('legend')} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-6 rounded-xl text-left transition-all">
          <h3 className="text-xl font-bold text-purple-400 flex items-center gap-2 mb-4"><Trophy size={24}/> La Gran Final</h3>
          <p className="text-slate-400 text-sm">El simulador adaptativo. La IA detecta tus debilidades y te ataca donde más te cuesta.</p>
        </button>
      </div>
      <div className="mt-8 text-center"><button onClick={() => navigate('/dashboard')} className="text-slate-500 hover:text-white">Volver al Cuartel General</button></div>
    </div>
  );

  const renderPlaying = () => {
    const timeProgress = (timeLeft / TIME_PER_QUESTION) * 100;
    let timeColor = 'bg-emerald-400';
    if (timeProgress < 50) timeColor = 'bg-amber-400';
    if (timeProgress < 20) timeColor = 'bg-rose-500';

    return (
      <div className="bg-slate-900 text-slate-100 min-h-[80vh] rounded-2xl p-4 md:p-8 flex flex-col relative overflow-hidden">
        <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl mb-6 shadow-lg z-10">
          <div className="flex flex-col">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Puntaje</span>
            <span className="text-3xl font-black text-cyan-400">{score.toString().padStart(4, '0')}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Reloj</span>
            <span className="text-3xl font-black font-mono">00:{timeLeft.toString().padStart(2, '0')}</span>
          </div>
          <div className="flex gap-1">
            {[...Array(INITIAL_LIVES)].map((_, i) => (
              <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center ${i < lives ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-600'}`}>
                {i < lives && <Shield size={16} />}
              </div>
            ))}
          </div>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full mb-8 overflow-hidden"><div className={`h-full ${timeColor} transition-all duration-1000 ease-linear`} style={{ width: `${timeProgress}%` }} /></div>
        
        <PenaltyShootout feedback={feedback} />

        <div className="flex-1 flex flex-col items-center justify-center z-10 relative mt-8">
          {feedback === 'correct' && <div className="absolute top-0 text-emerald-400 font-black text-4xl animate-bounce">¡GOLAZO!</div>}
          {feedback === 'incorrect' && <div className="absolute top-0 text-rose-500 font-black text-4xl animate-pulse">¡ATAJADA!</div>}
          <div className="text-center mb-8">
            <span className="text-cyan-400 text-sm font-bold tracking-widest uppercase mb-2 block">
              {currentQuestion?.type === 'standard' ? 'Tiro Penal' : currentQuestion?.type === 'division' ? 'Penal con Amague' : 'Tiro Colocado'}
            </span>
            <div className="text-5xl md:text-7xl font-black font-mono tracking-tighter">
              {currentQuestion?.text.replace('?', '')}
              {currentQuestion?.text.includes('?') && <span className="text-emerald-400 animate-pulse">?</span>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
            {currentQuestion?.options.map((option: number, index: number) => {
              let btnStyle = "bg-slate-800 border-slate-600 text-slate-100 hover:bg-slate-700 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]";
              if (feedback !== null) {
                if (option === currentQuestion.answer) btnStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-105 z-10";
                else if (option === selectedAnswer) btnStyle = "bg-rose-500/20 border-rose-500 text-rose-400 scale-95 opacity-80";
                else btnStyle = "bg-slate-900 border-slate-800 text-slate-600 opacity-50";
              }
              return (
                <button key={index} onClick={() => handleOptionClick(option)} disabled={feedback !== null} className={`relative group py-6 rounded-2xl border-4 font-black text-4xl font-mono transition-all duration-200 active:scale-95 flex items-center justify-center ${btnStyle}`}>
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderGameOver = () => (
    <div className="bg-slate-900 text-slate-100 min-h-[80vh] rounded-2xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
      <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400 mb-4">Fin del Partido</h2>
      <p className="text-slate-400 text-lg mb-12">El árbitro ha pitado el final. Buen esfuerzo.</p>
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 w-full max-w-md mb-8">
        <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-6">
          <span className="text-slate-400 font-bold uppercase tracking-wider">Puntaje Total</span>
          <span className="text-5xl font-black text-emerald-400">{score}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400 font-bold uppercase tracking-wider">Racha Máxima</span>
          <span className="text-2xl font-bold text-cyan-400">x{streak}</span>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <button onClick={() => startGame(gameMode)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 px-6 rounded-xl transition-all">Revancha</button>
        <button onClick={finishAndSave} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black uppercase py-4 px-6 rounded-xl transition-transform hover:scale-105 shadow-[0_0_20px_rgba(16,185,129,0.4)]">Terminar y Cobrar</button>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto">
      {gameState === 'menu' && renderMenu()}
      {gameState === 'playing' && renderPlaying()}
      {gameState === 'gameover' && renderGameOver()}
    </div>
  );
}
