import React, { useState, createContext, useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import FootballMathGame from './components/FootballMathGame';
import GridMathGame from './components/GridMathGame';
import PowersBotGame from './components/PowersBotGame';
// Limpiado de imports no usados
import { db } from './firebase';
import { collection, doc, getDocs, onSnapshot, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

// --- TIPOS DE DATOS ---
type ContentBlock = 
  | { type: 'text'; content: string }
  | { type: 'highlight'; title: string; content: string };

type GameConfig = {
  type: 'multiple_choice'; 
  question: string;
  options: string[];
  correctIndex: number;
  skillTag?: string; 
};

interface LearningModule {
  id: string;
  type: 'standard' | 'diagnostic' | 'football_math' | 'grid_math' | 'powers_bot'; 
  title: string;
  theme: string;
  xpReward: number;
  explanation: ContentBlock[];
  games: GameConfig[]; 
  isInfinite?: boolean;
}

type ResourceType = 'video' | 'pdf' | 'link';

interface SharedResource {
  id: string;
  title: string;
  type: ResourceType;
  url: string;
  xpReward: number;
}

// --- DATOS INICIALES ---
const initialModules: Record<string, LearningModule> = {
  "1": { id: "1", type: "standard", title: "Fracciones Galácticas", theme: "espacio", xpReward: 50, explanation: [ { type: 'text', content: '¡Atención Comandante Pedro!' }, { type: 'highlight', title: '3 ÷ 4 = 3/4', content: 'Cada motor recibe tres cuartos de asteroide.' } ], games: [ { type: 'multiple_choice', question: '¿Qué fracción de pizza le toca a cada marciano para que sea justo?', options: ['1/4', '1/2', '2/1'], correctIndex: 1, skillTag: 'Lógica Matemática' } ] }
};

const initialResources: Record<string, SharedResource> = {
  "r1": { id: "r1", title: "Video: ¿Qué son las fracciones?", type: "video", url: "https://youtube.com", xpReward: 20 }
};

const initialStudents = [
  { id: '1', name: 'Pedro', pin: '1234', isFirstLogin: true, level: 2, xp: 110, coins: 25, streak: 3, interests: ['Espacio', 'Fútbol'], completedModules: ['1'], assignedModules: ['1'], skills: { 'Lógica Matemática': 90 }, assignedResources: ['r1'], viewedResources: ['r1'] },
  { id: '2', name: 'Sofía', pin: '1234', isFirstLogin: true, level: 4, xp: 350, coins: 120, streak: 5, interests: ['Animales', 'Ciencia'], completedModules: [], assignedModules: ['1'], skills: {}, assignedResources: ['r1'], viewedResources: [] },
];

// --- ESTADO GLOBAL ---
export type UserState = {
  id: string;
  name: string;
  pin: string;
  isFirstLogin: boolean;
  xp: number;
  level: number;
  streak: number;
  coins: number;
  completedModules: string[];
  assignedModules: string[];
  interests: string[];
  curso?: string;
  nextClass?: string;
  meetLink?: string;
  isRecurringClass?: boolean;
  skills: Record<string, number>;
  assignedResources: string[];
  viewedResources: string[];
};

type UserContextType = {
  user: UserState | null;
  allStudents: UserState[];
  modules: Record<string, LearningModule>;
  resources: Record<string, SharedResource>;
  login: (name: string, pin: string) => Promise<boolean>;
  logout: () => void;
  changePin: (newPin: string) => Promise<void>;
  createStudent: (name: string, curso: string, interests: string) => Promise<void>;
  resetPin: (id: string) => Promise<void>;
  addXp: (amount: number) => void;
  addCoins: (amount: number, studentId?: string) => void;
  markModuleCompleted: (id: string) => void;
  updateSkills: (sessionSkills: Record<string, { correct: number, total: number }>) => void;
  markResourceViewed: (id: string, xpReward: number) => void;
  deleteStudent: (id: string) => void;
};

const UserContext = createContext<UserContextType | null>(null);

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser debe usarse dentro de UserProvider");
  return ctx;
}

const XP_PER_LEVEL = 100;

function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserState | null>(() => {
    const savedId = localStorage.getItem('tutorapp_user_id');
    return savedId ? ({ id: savedId } as UserState) : null;
  });
  const [allStudents, setAllStudents] = useState<UserState[]>([]);
  const [modules, setModules] = useState<Record<string, LearningModule>>({});
  const [resources, setResources] = useState<Record<string, SharedResource>>({});

  useEffect(() => {
    const initializeDb = async () => {
      try {
        const snap = await getDocs(collection(db, "students"));
        if (snap.empty) {
          for (const s of initialStudents) await setDoc(doc(db, "students", s.id), s);
          for (const m of Object.values(initialModules)) await setDoc(doc(db, "modules", m.id), m);
          for (const r of Object.values(initialResources)) await setDoc(doc(db, "resources", r.id), r);
        }
      } catch (err) {
        console.error("Error inicializando DB:", err);
      }
    };
    initializeDb();

    const unsubStudents = onSnapshot(collection(db, "students"), (snap) => {
      const studentsData = snap.docs.map(d => ({id: d.id, ...d.data()} as UserState));
      setAllStudents(studentsData);
      setUser(prevUser => {
        if (!prevUser) return null;
        const updated = studentsData.find(s => s.id === prevUser.id);
        return updated || prevUser; // NUNCA desloguear automáticamente por un snapshot vacío
      });
    });

    const unsubModules = onSnapshot(collection(db, "modules"), (snap) => {
      const mods: Record<string, LearningModule> = {};
      snap.forEach(d => { mods[d.id] = d.data() as LearningModule; });
      setModules(mods);
    });

    const unsubResources = onSnapshot(collection(db, "resources"), (snap) => {
      const res: Record<string, SharedResource> = {};
      snap.forEach(d => { res[d.id] = d.data() as SharedResource; });
      setResources(res);
    });

    return () => {
      unsubStudents();
      unsubModules();
      unsubResources();
    };
  }, []);

  const login = async (name: string, pin: string) => {
    const found = allStudents.find(s => s.name.toLowerCase().trim() === name.toLowerCase().trim() && s.pin === pin);
    if (found) {
      setUser(found);
      localStorage.setItem('tutorapp_user_id', found.id);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('tutorapp_user_id');
  };

  const changePin = async (newPin: string) => {
    if (!user) return;
    await updateDoc(doc(db, "students", user.id), { pin: newPin, isFirstLogin: false });
  };

  const resetPin = async (id: string) => {
    await updateDoc(doc(db, "students", id), { pin: "1234", isFirstLogin: true });
  };

  const createStudent = async (name: string, curso: string, interests: string) => {
    const newId = Date.now().toString();
    const arrInterests = interests.split(',').map(i => i.trim()).filter(i => i !== '');
    const newStudent: UserState = {
      id: newId, name, pin: '1234', isFirstLogin: true, level: 1, xp: 0, coins: 0, streak: 0,
      completedModules: [], assignedModules: [], interests: arrInterests, curso, skills: {}, assignedResources: [], viewedResources: []
    };
    await setDoc(doc(db, "students", newId), newStudent);
  };

  const addXp = async (amount: number) => {
    if (!user) return;
    const newXp = user.xp + amount;
    const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;
    await updateDoc(doc(db, "students", user.id), { xp: newXp, level: newLevel });
  };

  const addCoins = async (amount: number, studentId?: string) => {
    const targetId = studentId || user?.id;
    if (!targetId) return;
    const targetUser = allStudents.find(s => s.id === targetId);
    if (!targetUser) return;
    await updateDoc(doc(db, "students", targetId), { coins: targetUser.coins + amount });
  };

  const markModuleCompleted = async (id: string) => {
    if (!user) return;
    if (user.completedModules.includes(id)) return;
    await updateDoc(doc(db, "students", user.id), { completedModules: [...user.completedModules, id] });
  };

  const updateSkills = async (sessionSkills: Record<string, { correct: number, total: number }>) => {
    if (!user) return;
    const newSkills = { ...user.skills };
    Object.keys(sessionSkills).forEach(k => {
      const percent = Math.round((sessionSkills[k].correct / sessionSkills[k].total) * 100);
      newSkills[k] = percent;
    });
    await updateDoc(doc(db, "students", user.id), { skills: newSkills });
  };

  const markResourceViewed = async (id: string, xpReward: number) => {
    if (!user) return;
    if (user.viewedResources.includes(id)) return;
    const newXp = user.xp + xpReward;
    const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;
    await updateDoc(doc(db, "students", user.id), { xp: newXp, level: newLevel, viewedResources: [...user.viewedResources, id] });
  };

  const deleteStudent = async (id: string) => {
    await deleteDoc(doc(db, "students", id));
  };

  return (
    <UserContext.Provider value={{ user, allStudents, modules, resources, login, logout, changePin, resetPin, createStudent, addXp, addCoins, markModuleCompleted, updateSkills, markResourceViewed, deleteStudent }}>
      {children}
    </UserContext.Provider>
  );
}

// utilidades removidas

// --- COMPONENTES UI: ESTUDIANTE ---

function Login() {
  const { login } = useUser();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await login(name, pin);
    if (success) navigate('/dashboard');
    else setError('Nombre o PIN incorrecto 😢');
  };

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h1 className="text-gradient">TutorApp</h1>
        <p className="text-secondary" style={{ marginBottom: '2rem' }}>Ingresa para continuar tu aventura.</p>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input type="text" placeholder="Tu Nombre (Ej. Pedro)" value={name} onChange={e => setName(e.target.value)} required style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--bg-elevated)', background: 'var(--bg-secondary)', color: 'white', fontSize: '1rem', outline: 'none', textAlign: 'center' }} />
          <input type="password" placeholder="Tu PIN Secreto" value={pin} onChange={e => setPin(e.target.value)} required maxLength={4} style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--bg-elevated)', background: 'var(--bg-secondary)', color: 'white', fontSize: '1rem', outline: 'none', textAlign: 'center', letterSpacing: '0.2em' }} />
          {error && <p style={{color: 'var(--color-error)', margin: 0, fontSize: '0.875rem'}}>{error}</p>}
          <button type="submit" className="btn btn-primary">Entrar como Estudiante</button>
        </form>
        <Link to="/teacher" className="btn btn-secondary" style={{marginTop: '2rem', border: 'none'}}>Acceso Profesores</Link>
      </motion.div>
    </div>
  );
}

function Dashboard() {
  const { user, modules, logout, changePin } = useUser();
  const navigate = useNavigate();
  const [newPin, setNewPin] = useState('');

  useEffect(() => {
    if (user === null) {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user || !user.name) {
    return (
      <div className="container" style={{padding: '2rem', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
        <h2 className="text-gradient mb-4">Cargando base de datos secreta... 🕵️‍♂️</h2>
        <p className="text-secondary">Conectando con la nave nodriza...</p>
        <button onClick={() => navigate('/')} className="btn btn-secondary" style={{marginTop: '2rem'}}>Volver al Inicio Manualmente</button>
      </div>
    );
  }

  if (user.isFirstLogin) {
    return (
      <div className="container" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh'}}>
        <motion.div className="card" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{textAlign: 'center', maxWidth: '400px', width: '100%'}}>
           <h2 style={{fontSize: '2rem'}}>¡Hola {user.name}! 🕵️</h2>
           <p className="text-secondary" style={{marginBottom: '2rem'}}>Estás usando el PIN genérico. Para proteger tu base secreta, inventa un PIN de 4 números que solo tú sepas.</p>
           <input type="password" maxLength={4} placeholder="Nuevo PIN (ej. 5678)" value={newPin} onChange={e => setNewPin(e.target.value)} style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--accent-primary)', background: 'var(--bg-secondary)', color: 'white', fontSize: '1.5rem', outline: 'none', textAlign: 'center', letterSpacing: '0.5em', width: '100%' }} />
           <button onClick={() => changePin(newPin)} disabled={newPin.length < 4} className="btn btn-primary" style={{width: '100%', marginTop: '1.5rem', padding: '1rem'}}>Guardar PIN Secreto</button>
        </motion.div>
      </div>
    )
  }

  const currentLevelXp = user.xp % XP_PER_LEVEL;
  const progressPercent = (currentLevelXp / XP_PER_LEVEL) * 100;

  const mainMissions = user.assignedModules.filter(id => modules[id] && !modules[id].isInfinite);
  const infiniteMissions = user.assignedModules.filter(id => modules[id] && modules[id].isInfinite);

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h2>Hola, <span className="text-gradient">{user.name}</span> 👋</h2>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.5rem 1rem', borderRadius: '999px', border: '1px solid rgba(255,215,0,0.3)' }}>
            <span style={{ color: '#FBBF24' }}>💰</span><strong style={{ fontSize: '0.875rem', color: '#FBBF24' }}>{user.coins} Monedas</strong>
          </div>
          <button onClick={() => { logout(); navigate('/'); }} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>Salir</button>
        </div>
      </header>

      <section className="card" style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
        <div style={{ background: 'var(--gradient-primary)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', color: 'white', flexShrink: 0 }}>{user.level}</div>
        <div style={{ flexGrow: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <strong style={{ color: 'var(--color-xp)' }}>{currentLevelXp} / {XP_PER_LEVEL} XP</strong>
            <span className="text-secondary" style={{ fontSize: '0.875rem' }}>Para el Nivel {user.level + 1}</span>
          </div>
          <div style={{ background: 'var(--bg-elevated)', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 1 }} style={{ height: '100%', background: 'var(--gradient-xp)' }} />
          </div>
        </div>
      </section>

      {/* MISIONES PRINCIPALES */}
      {mainMissions.length > 0 && (
        <section style={{ marginBottom: '4rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>📚</span> Misiones Principales</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {mainMissions.map(modId => {
              const mod = modules[modId];
              const isCompleted = user.completedModules.includes(mod.id);
              return (
                <Link key={mod.id} to={`/module/${mod.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  <motion.div className="card" style={{ cursor: 'pointer', borderTop: `4px solid ${isCompleted ? 'var(--color-success)' : 'var(--accent-primary)'}`, opacity: isCompleted ? 0.8 : 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0' }}>{mod.title}</h4>
                      {isCompleted && <span style={{ fontSize: '0.75rem', background: 'var(--color-success)', color: 'black', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>COMPLETADO</span>}
                    </div>
                    <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>Temática: {mod.theme}</p>
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-xp)', fontWeight: 'bold' }}>+{mod.xpReward} XP</span>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ENTRENAMIENTO INFINITO */}
      {infiniteMissions.length > 0 && (
        <section style={{ marginBottom: '4rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>♾️</span> Entrenamiento Libre</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {infiniteMissions.map(modId => {
              const mod = modules[modId];
              return (
                <Link key={mod.id} to={`/module/${mod.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  <motion.div className="card" style={{ cursor: 'pointer', borderTop: `4px solid #FBBF24` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0' }}>{mod.title}</h4>
                      <span style={{ fontSize: '0.75rem', background: '#FBBF24', color: 'black', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>INFINITO</span>
                    </div>
                    <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>Temática: {mod.theme}</p>
                    <span style={{ fontSize: '0.875rem', color: '#FBBF24', fontWeight: 'bold' }}>Gana Monedas al Jugar</span>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function ModuleView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { modules, addXp, markModuleCompleted } = useUser();
  const moduleData = id ? modules[id] : null;

  const [step, setStep] = useState<'explanation' | 'games'>('explanation');
  const [gameIndex, setGameIndex] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!moduleData) return <div className="container">Módulo no encontrado.</div>;

  if (moduleData.type === 'football_math') {
    return (
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={{ marginBottom: '2rem' }}>← Abandonar Misión</button>
        <FootballMathGame moduleData={moduleData} />
      </div>
    );
  }

  if (moduleData.type === 'grid_math') {
    return (
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={{ marginBottom: '2rem' }}>← Abandonar Misión</button>
        <GridMathGame moduleData={moduleData} />
      </div>
    );
  }

  if (moduleData.type === 'powers_bot') {
    return <PowersBotGame moduleData={moduleData} />;
  }

  const handleOptionSelect = (idx: number) => {
    if (feedback !== null) return;
    const currentGame = moduleData.games[gameIndex];
    if (idx === currentGame.correctIndex) {
      setFeedback('correct');
      setTimeout(() => {
        setFeedback(null);
        if (gameIndex + 1 < moduleData.games.length) {
          setGameIndex(gameIndex + 1);
        } else {
          addXp(moduleData.xpReward);
          markModuleCompleted(moduleData.id);
          navigate('/dashboard');
        }
      }, 1500);
    } else {
      setFeedback('incorrect');
      setTimeout(() => setFeedback(null), 1500);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem', maxWidth: '800px' }}>
      <button onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={{ marginBottom: '2rem' }}>← Abandonar Misión</button>
      <div className="card">
        <h2 style={{margin: '0 0 1rem 0'}}>{moduleData.title}</h2>
        <p className="text-secondary" style={{margin: '0 0 2rem 0'}}>Temática: {moduleData.theme} | Recompensa: {moduleData.xpReward} XP</p>
        
        {step === 'explanation' && (
          <div>
            <h3 style={{borderBottom: '1px solid var(--bg-elevated)', paddingBottom: '0.5rem', marginBottom: '1rem'}}>Teoría y Explicación</h3>
            {moduleData.explanation.map((b, i) => (
              <div key={i} style={{marginBottom: '1rem', padding: '1rem', background: b.type === 'highlight' ? 'var(--bg-elevated)' : 'transparent', borderRadius: '8px'}}>
                {b.type === 'highlight' && <h4 className="text-gradient" style={{margin: '0 0 0.5rem 0'}}>{b.title}</h4>}
                <p style={{margin: 0, fontSize: '1.1rem', lineHeight: '1.6'}}>{b.content}</p>
              </div>
            ))}
            
            <div style={{textAlign: 'center', marginTop: '2rem'}}>
              <button onClick={() => setStep('games')} className="btn btn-primary" style={{padding: '1rem 2rem', fontSize: '1.2rem'}}>¡A los Desafíos! 🚀</button>
            </div>
          </div>
        )}

        {step === 'games' && moduleData.games.length > 0 && (
          <div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', color: 'var(--color-xp)'}}>
                <span style={{fontWeight: 'bold'}}>Desafío {gameIndex + 1} de {moduleData.games.length}</span>
              </div>
              <div style={{ width: '100%', background: 'var(--bg-elevated)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${(gameIndex / moduleData.games.length) * 100}%`, background: 'var(--gradient-xp)', height: '100%', transition: 'width 0.3s ease-out' }}></div>
              </div>
            </div>
            
            <p style={{fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '2rem'}}>{moduleData.games[gameIndex].question}</p>
            
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              {moduleData.games[gameIndex].options.map((opt, idx) => {
                let bg = 'var(--bg-elevated)';
                let border = '2px solid transparent';
                if (feedback === 'correct' && idx === moduleData.games[gameIndex].correctIndex) {
                  bg = 'var(--color-success)';
                } else if (feedback === 'incorrect' && idx !== moduleData.games[gameIndex].correctIndex) {
                  bg = 'var(--color-error)';
                }

                return (
                  <button 
                    key={idx} 
                    onClick={() => handleOptionSelect(idx)}
                    style={{
                      padding: '1.25rem', 
                      background: bg, 
                      border, 
                      borderRadius: '12px', 
                      color: 'white',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      textAlign: 'left',
                      cursor: feedback ? 'default' : 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {feedback === 'correct' && <p style={{color: 'var(--color-success)', fontWeight: 'bold', textAlign: 'center', marginTop: '2rem', fontSize: '1.2rem', animation: 'pulse 1s infinite'}}>¡Respuesta Correcta! 🎉</p>}
            {feedback === 'incorrect' && <p style={{color: 'var(--color-error)', fontWeight: 'bold', textAlign: 'center', marginTop: '2rem', fontSize: '1.2rem'}}>¡Casi! Intenta de nuevo 😅</p>}
          </div>
        )}
      </div>
    </div>
  );
}

// --- PREVISUALIZADOR LOCAL PARA LA PROFESORA ---
function PreviewModuleView() {
  const navigate = useNavigate();
  const [moduleData, setModuleData] = useState<LearningModule | null>(null);

  useEffect(() => {
    fetch('/preview.json')
      .then(res => res.json())
      .then(data => setModuleData(data))
      .catch(err => console.error("Error cargando previsualización:", err));
  }, []);

  if (!moduleData) return (
    <div className="container" style={{padding: '2rem'}}>
      <div className="card" style={{textAlign: 'center'}}>
        <h2>No hay ningún borrador activo 👀</h2>
        <p className="text-secondary">Pídele a Antigravity que cree un módulo para poder previsualizarlo aquí.</p>
        <button onClick={() => navigate('/teacher')} className="btn btn-secondary" style={{marginTop: '1rem'}}>Volver al Panel</button>
      </div>
    </div>
  );

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem', maxWidth: '800px' }}>
      <div style={{background: 'var(--color-warning)', color: 'black', padding: '0.5rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <span>⚠️ MODO PREVISUALIZACIÓN (BORRADOR)</span>
        <button onClick={() => navigate('/teacher')} className="btn" style={{background: 'black', color: 'white', border: 'none', padding: '0.25rem 0.5rem', fontSize: '0.875rem'}}>Cerrar Previsualización</button>
      </div>
      <div className="card">
         <h2 style={{margin: '0 0 1rem 0'}}>{moduleData.title}</h2>
         <p className="text-secondary" style={{margin: '0 0 2rem 0'}}>Temática: {moduleData.theme} | Recompensa: {moduleData.xpReward} XP</p>
         <h3 style={{borderBottom: '1px solid var(--bg-elevated)', paddingBottom: '0.5rem', marginBottom: '1rem'}}>Explicación:</h3>
         {moduleData.explanation.map((b, i) => (
           <div key={i} style={{marginBottom: '1rem', padding: '1rem', background: b.type === 'highlight' ? 'var(--bg-elevated)' : 'transparent', borderRadius: '8px'}}>
             {b.type === 'highlight' && <h4 className="text-gradient" style={{margin: '0 0 0.5rem 0'}}>{b.title}</h4>}
             <p style={{margin: 0}}>{b.content}</p>
           </div>
         ))}
         <h3 style={{borderBottom: '1px solid var(--bg-elevated)', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '2rem'}}>Juegos / Preguntas:</h3>
         {moduleData.games.map((g, i) => (
           <div key={i} style={{marginBottom: '1.5rem', padding: '1.5rem', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--bg-elevated)'}}>
             <p style={{margin: '0 0 1rem 0', fontWeight: 'bold'}}>{i+1}. {g.question}</p>
             <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
               {g.options.map((opt, idx) => (
                 <div key={idx} style={{padding: '0.75rem', background: idx === g.correctIndex ? 'var(--color-success)' : 'var(--bg-elevated)', borderRadius: '8px', color: 'white', border: idx === g.correctIndex ? '2px solid white' : 'none'}}>
                   {opt} {idx === g.correctIndex && '(Respuesta Correcta)'}
                 </div>
               ))}
             </div>
           </div>
         ))}
      </div>
      <div style={{textAlign: 'center', marginTop: '2rem'}}>
        <p className="text-secondary" style={{marginBottom: '1rem'}}>Si el módulo te gusta, dile a tu Antigravity: "Todo perfecto, súbelo a la nube".</p>
      </div>
    </div>
  )
}

function TeacherAuthWrapper({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [isAuth, setIsAuth] = useState(localStorage.getItem('teacherAuth') === 'true');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (isAuth) {
    return <>{children}</>;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Profe2368') {
      localStorage.setItem('teacherAuth', 'true');
      setIsAuth(true);
    } else {
      setError('Clave incorrecta. Acceso denegado.');
    }
  };

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem' }}>Acceso Profesores 👩‍🏫</h2>
        <p className="text-secondary" style={{ marginBottom: '2rem' }}>Ingresa la clave de administrador</p>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input type="password" placeholder="Clave secreta" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--bg-elevated)', background: 'var(--bg-secondary)', color: 'white', textAlign: 'center', letterSpacing: '0.2em' }} />
          {error && <p style={{color: 'var(--color-error)', margin: 0, fontWeight: 'bold'}}>{error}</p>}
          <button type="submit" className="btn btn-primary">Verificar Identidad</button>
          <button type="button" onClick={() => navigate('/')} className="btn btn-secondary" style={{border: 'none'}}>← Volver al Inicio</button>
        </form>
      </motion.div>
    </div>
  );
}

function TeacherDashboard() {
  const navigate = useNavigate();
  const { allStudents, createStudent } = useUser();
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCurso, setNewCurso] = useState('');
  const [newInterests, setNewInterests] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createStudent(newName, newCurso, newInterests);
    setShowModal(false);
    setNewName('');
    setNewCurso('');
    setNewInterests('');
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
       <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem'}}>
         <div>
           <h2 style={{margin: 0}}>Panel de Profesora 👩‍🏫</h2>
           <p className="text-secondary" style={{margin: 0, marginTop: '0.5rem'}}>Directorio de Estudiantes (Nube ☁️)</p>
         </div>
         <div style={{display: 'flex', gap: '1rem'}}>
           <button onClick={() => navigate('/preview')} className="btn btn-secondary" style={{borderColor: 'var(--color-warning)', color: 'var(--color-warning)'}}>👁️ Ver Previsualización Activa</button>
           <Link to="/" className="btn btn-secondary">Salir al Login</Link>
         </div>
       </header>

       <div style={{marginBottom: '2rem'}}>
         <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{padding: '1rem 2rem'}}>+ Añadir Nuevo Estudiante</button>
       </div>

       {showModal && (
         <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100}}>
           <motion.div initial={{scale: 0.9, opacity: 0}} animate={{scale: 1, opacity: 1}} className="card" style={{width: '100%', maxWidth: '400px'}}>
             <h3 style={{marginTop: 0}}>Crear Estudiante</h3>
             <form onSubmit={handleCreate} style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem'}}>
               <input type="text" placeholder="Nombre (Ej. Mateo)" required value={newName} onChange={e => setNewName(e.target.value)} style={{padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--bg-elevated)', background: 'var(--bg-secondary)', color: 'white'}} />
               <input type="text" placeholder="Curso (Ej. 3ro Básico)" required value={newCurso} onChange={e => setNewCurso(e.target.value)} style={{padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--bg-elevated)', background: 'var(--bg-secondary)', color: 'white'}} />
               <input type="text" placeholder="Intereses (Ej. Minecraft, Dinos)" required value={newInterests} onChange={e => setNewInterests(e.target.value)} style={{padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--bg-elevated)', background: 'var(--bg-secondary)', color: 'white'}} />
               <p className="text-secondary" style={{fontSize: '0.875rem', margin: 0}}>El estudiante se creará con el PIN inicial de <strong>1234</strong>.</p>
               <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
                 <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{flex: 1}}>Cancelar</button>
                 <button type="submit" className="btn btn-primary" style={{flex: 1}}>Crear Perfil</button>
               </div>
             </form>
           </motion.div>
         </div>
       )}

       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {allStudents.map(student => (
            <motion.div whileHover={{y: -5}} key={student.id} className="card" style={{cursor: 'pointer', borderTop: '4px solid var(--color-xp)'}} onClick={() => navigate(`/teacher/student/${student.id}`)}>
               <h3 style={{marginTop: 0}}>{student.name}</h3>
               <p className="text-secondary" style={{fontSize: '0.875rem', margin: '0 0 0.5rem 0'}}>Curso: {student.curso || 'Sin curso'}</p>
               <p className="text-secondary" style={{fontSize: '0.875rem', marginBottom: '1.5rem'}}>Intereses: {student.interests.join(', ')}</p>
               <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: '8px'}}>
                 <span style={{fontWeight: 'bold', color: 'var(--color-xp)'}}>Nivel {student.level}</span>
                 <span style={{color: '#FBBF24'}}>💰 {student.coins}</span>
               </div>
            </motion.div>
          ))}
       </div>
    </div>
  )
}

function TeacherStudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { allStudents, resetPin, deleteStudent } = useUser();
  const student = allStudents.find(s => s.id === id);

  if (!student) return <div className="container" style={{padding: '2rem'}}>Estudiante no encontrado...</div>;

  const handleResetPin = async () => {
    if (window.confirm(`¿Resetear el PIN de ${student.name} a 1234?`)) {
      await resetPin(student.id);
      alert('PIN reseteado con éxito a 1234.');
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`¿Estás segura de que quieres borrar a ${student.name}?`)) {
      await deleteStudent(student.id);
      navigate('/teacher');
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem', maxWidth: '800px' }}>
      <button onClick={() => navigate('/teacher')} className="btn btn-secondary" style={{marginBottom: '2rem', padding: '0.5rem 1rem'}}>← Volver al Directorio</button>
      
      <div className="card" style={{marginBottom: '2rem'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
          <div>
            <h2 style={{margin: 0}}>Expediente: {student.name}</h2>
          </div>
          <span className="text-gradient" style={{fontSize: '1.5rem', fontWeight: 'bold'}}>Nivel {student.level}</span>
        </div>

        <div style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--bg-elevated)', marginBottom: '2rem' }}>
          <h3 style={{marginTop: 0, marginBottom: '1rem'}}>Seguridad del Alumno</h3>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'}}>
             <div>
               <p style={{margin: '0 0 0.5rem 0', fontWeight: 'bold'}}>Estado del PIN</p>
               <p className="text-secondary" style={{margin: 0, fontSize: '0.875rem'}}>
                 {student.isFirstLogin ? 'Usando PIN genérico (1234)' : 'Ha configurado un PIN Secreto Personal'}
               </p>
             </div>
             <button onClick={handleResetPin} className="btn btn-secondary" style={{borderColor: 'var(--color-warning)', color: 'var(--color-warning)'}}>🔄 Resetear PIN a 1234</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', borderTop: '1px solid var(--bg-elevated)', paddingTop: '1.5rem' }}>
           <button className="btn btn-secondary" onClick={handleDelete} style={{borderColor: 'var(--color-error)', color: 'var(--color-error)', marginLeft: 'auto'}}>🗑️ Borrar Estudiante</button>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/module/:id" element={<ModuleView />} />
          <Route path="/preview" element={<PreviewModuleView />} />
          <Route path="/teacher" element={<TeacherAuthWrapper><TeacherDashboard /></TeacherAuthWrapper>} />
          <Route path="/teacher/student/:id" element={<TeacherAuthWrapper><TeacherStudentDetail /></TeacherAuthWrapper>} />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;
