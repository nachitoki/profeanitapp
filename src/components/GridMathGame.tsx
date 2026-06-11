import { useState } from 'react';
import { useUser } from '../App';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';

const QUESTIONS = [
  { a: 5, b: 4 },
  { a: 3, b: 6 },
  { a: 7, b: 2 },
  { a: 12, b: 3 },
  { a: 8, b: 4 },
];

export default function GridMathGame({ moduleData }: { moduleData: any }) {
  const { addXp, addCoins, markModuleCompleted } = useUser();
  const navigate = useNavigate();

  const [gameState, setGameState] = useState<'playing' | 'gameover'>('playing');
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);

  const [dragStart, setDragStart] = useState<{ r: number; c: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ r: number; c: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [hasSelectedArea, setHasSelectedArea] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showAnimation, setShowAnimation] = useState(false);

  const currentQ = QUESTIONS[qIndex];

  // Coordenadas calculadas
  const minR = dragStart && dragEnd ? Math.min(dragStart.r, dragEnd.r) : -1;
  const maxR = dragStart && dragEnd ? Math.max(dragStart.r, dragEnd.r) : -1;
  const minC = dragStart && dragEnd ? Math.min(dragStart.c, dragEnd.c) : -1;
  const maxC = dragStart && dragEnd ? Math.max(dragStart.c, dragEnd.c) : -1;

  const isCellSelected = (r: number, c: number) => {
    return r >= minR && r <= maxR && c >= minC && c <= maxC;
  };

  const handleMouseDown = (r: number, c: number) => {
    if (hasSelectedArea || showAnimation) return;
    setDragStart({ r, c });
    setDragEnd({ r, c });
    setIsDragging(true);
  };

  const handleMouseEnter = (r: number, c: number) => {
    if (isDragging && !hasSelectedArea && !showAnimation) {
      setDragEnd({ r, c });
    }
  };

  const handleMouseUp = () => {
    if (isDragging && dragStart && dragEnd) {
      setIsDragging(false);
      const rows = maxR - minR + 1;
      const cols = maxC - minC + 1;

      // Validar si es a x b o b x a
      if (
        (rows === currentQ.a && cols === currentQ.b) ||
        (rows === currentQ.b && cols === currentQ.a)
      ) {
        setHasSelectedArea(true);
      } else {
        // Área incorrecta, resetear
        setDragStart(null);
        setDragEnd(null);
      }
    }
  };

  const checkResult = () => {
    const total = currentQ.a * currentQ.b;
    if (parseInt(inputValue) === total) {
      // Éxito
      setShowAnimation(true);
      setScore((s) => s + 50);
      
      // Confetti
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#34D399', '#38BDF8', '#FBBF24']
      });

      setTimeout(() => {
        if (qIndex + 1 < QUESTIONS.length) {
          setQIndex(qIndex + 1);
          resetTurn();
        } else {
          setGameState('gameover');
        }
      }, 3500);
    } else {
      // Si se equivoca en el número, borrar el número y dar pistas
      setInputValue('');
    }
  };

  const resetTurn = () => {
    setDragStart(null);
    setDragEnd(null);
    setHasSelectedArea(false);
    setInputValue('');
    setShowAnimation(false);
  };

  const finishAndSave = () => {
    addXp(score);
    addCoins(Math.floor(score / 5));
    if (moduleData) {
      markModuleCompleted(moduleData.id);
    }
    navigate('/dashboard');
  };

  if (gameState === 'gameover') {
    return (
      <div className="w-full max-w-4xl mx-auto bg-green-900 min-h-[80vh] rounded-2xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden border-8 border-green-700 shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]">
         <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500 mb-4 drop-shadow-lg">¡Entrenamiento Completado!</h2>
         <p className="text-white text-xl font-bold mb-8">Puntaje Total: {score}</p>
         <button onClick={finishAndSave} className="bg-yellow-400 hover:bg-yellow-300 text-green-900 font-black text-xl py-4 px-8 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.6)] transition-transform hover:scale-110">
           Terminar y Cobrar
         </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-green-800 min-h-[80vh] rounded-2xl p-4 md:p-8 flex flex-col items-center relative overflow-hidden border-4 border-white/20 shadow-2xl select-none" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      
      {/* Patrón de pasto en el fondo */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, #ffffff 40px, #ffffff 41px)' }}></div>
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 40px, #ffffff 40px, #ffffff 41px)' }}></div>

      {/* Header */}
      <div className="bg-green-900/80 backdrop-blur-md w-full p-4 rounded-xl mb-6 shadow-lg z-10 flex justify-between items-center border border-green-700">
        <div className="flex flex-col">
          <span className="text-green-300 text-xs font-bold uppercase tracking-wider">Puntaje</span>
          <span className="text-3xl font-black text-white">{score.toString().padStart(4, '0')}</span>
        </div>
        
        <div className="text-center bg-green-950 px-6 py-2 rounded-xl border border-green-800">
          <span className="text-green-400 text-sm font-bold uppercase tracking-widest block mb-1">Dibuja la matriz</span>
          <span className="text-4xl font-black text-yellow-300 drop-shadow-md">
            {currentQ.a} × {currentQ.b}
          </span>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-green-300 text-xs font-bold uppercase tracking-wider">Desafío</span>
          <span className="text-2xl font-black text-white">{qIndex + 1} / {QUESTIONS.length}</span>
        </div>
      </div>

      {/* Grid 12x12 */}
      <div className="bg-green-950/80 p-3 md:p-4 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] z-10 border-2 border-green-700">
        <div 
          className="grid gap-[2px] bg-green-900" 
          style={{ gridTemplateColumns: 'repeat(12, minmax(0, 1fr))' }}
          onMouseLeave={handleMouseUp}
        >
          {Array.from({ length: 12 }).map((_, r) => (
            Array.from({ length: 12 }).map((_, c) => {
              const selected = isCellSelected(r, c);
              return (
                <div 
                  key={`${r}-${c}`}
                  className={`w-6 h-6 md:w-10 md:h-10 border border-green-800/50 rounded-sm transition-colors duration-100 cursor-pointer flex items-center justify-center
                    ${selected ? 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)] z-10 scale-105' : 'bg-green-700/50 hover:bg-green-600/50'}
                  `}
                  onMouseDown={(e) => { e.preventDefault(); handleMouseDown(r, c); }}
                  onMouseEnter={() => handleMouseEnter(r, c)}
                  onTouchStart={(e) => { e.preventDefault(); handleMouseDown(r, c); }}
                  onTouchMove={(e) => { 
                    const touch = e.touches[0];
                    const element = document.elementFromPoint(touch.clientX, touch.clientY);
                    if (element && element.getAttribute('data-r') !== null) {
                       handleMouseEnter(parseInt(element.getAttribute('data-r')!), parseInt(element.getAttribute('data-c')!));
                    }
                  }}
                  onTouchEnd={handleMouseUp}
                  data-r={r}
                  data-c={c}
                >
                  {selected && <div className="w-full h-full opacity-20 bg-white rounded-sm"></div>}
                </div>
              )
            })
          ))}
        </div>
      </div>

      {/* Input de resultado */}
      {hasSelectedArea && !showAnimation && (
        <div className="absolute bottom-10 bg-white p-6 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-20 flex flex-col items-center animate-bounce">
          <p className="text-green-900 font-bold mb-2">¡Área correcta! Ahora, ¿cuánto es el total?</p>
          <div className="flex gap-4 items-center">
             <input 
               type="number" 
               className="text-4xl font-black w-24 text-center border-4 border-green-500 rounded-xl py-2 text-green-900 focus:outline-none focus:ring-4 focus:ring-green-300"
               value={inputValue}
               onChange={(e) => setInputValue(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && checkResult()}
               autoFocus
             />
             <button onClick={checkResult} className="bg-green-500 hover:bg-green-400 text-white font-black py-4 px-6 rounded-xl shadow-lg">Confirmar</button>
          </div>
        </div>
      )}

      {/* Animación de Golazos cruzados */}
      {showAnimation && (
        <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
           <div className="absolute font-black text-yellow-300 text-7xl md:text-9xl drop-shadow-[0_10px_0_#166534] z-50 animate-[ping_1s_ease-in-out_infinite]">¡GOLAZO!</div>
           
           <div className="absolute left-[-10%] top-1/2 text-6xl animate-[spin_2s_linear_infinite] transition-transform duration-[3s]" style={{ transform: 'translateX(120vw)' }}>⚽</div>
           <div className="absolute right-[-10%] top-1/3 text-6xl animate-[spin_1.5s_linear_infinite] transition-transform duration-[3s]" style={{ transform: 'translateX(-120vw)' }}>⚽</div>
           <div className="absolute left-1/4 bottom-[-10%] text-6xl animate-[spin_2.5s_linear_infinite] transition-transform duration-[3s]" style={{ transform: 'translateY(-120vh)' }}>⚽</div>
        </div>
      )}
    </div>
  );
}
