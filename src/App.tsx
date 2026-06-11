import React, { useState, createContext, useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { generateMathExercise } from './utils/generators';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
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
  type: 'standard' | 'diagnostic'; 
  title: string;
  theme: string;
  xpReward: number;
  explanation: ContentBlock[];
  games: GameConfig[]; 
}

type ResourceType = 'video' | 'pdf' | 'link';

interface SharedResource {
  id: string;
  title: string;
  type: ResourceType;
  url: string;
  xpReward: number;
}

// --- DATOS INICIALES (Para la primera vez que se crea la BD en la nube) ---
const initialModules: Record<string, LearningModule> = {
  "1": {
    id: "1", type: "standard", title: "Fracciones Galácticas", theme: "espacio", xpReward: 50,
    explanation: [
      { type: 'text', content: '¡Atención Comandante Pedro!' },
      { type: 'text', content: 'Nuestra nave necesita energía. Hemos recolectado **3 asteroides de cristal**, pero tenemos **4 motores** que alimentar en la nave principal.' },
      { type: 'text', content: 'Para que la nave avance a la velocidad de la luz, debemos dividir los asteroides en partes exactamente iguales. Esto significa que cada motor recibirá una *fracción* del total.' },
      { type: 'highlight', title: '3 ÷ 4 = 3/4', content: 'Cada motor recibe tres cuartos de asteroide.' }
    ],
    games: [
      { type: 'multiple_choice', question: 'Durante el viaje, encontramos 1 pizza espacial 🍕 intacta y hay 2 marcianos aliados hambrientos 👽👽 en la tripulación.\n\n¿Qué fracción de pizza le toca a cada marciano para que sea justo?', options: ['1/4 (Un cuarto)', '1/2 (Un medio)', '2/1 (Dos enteros)'], correctIndex: 1, skillTag: 'Lógica Matemática' }
    ]
  },
  "2": {
    id: "2", type: "standard", title: "Suma de Goles", theme: "futbol", xpReward: 60,
    explanation: [
      { type: 'text', content: '¡Al campo de juego, goleador!' },
      { type: 'text', content: 'En el primer tiempo anotaste **2 goles** y en el segundo tiempo metiste **3 goles** más.' },
      { type: 'highlight', title: '2 + 3 = 5', content: '¡Marcaste 5 goles en total!' }
    ],
    games: [
      { type: 'multiple_choice', question: 'Si en el próximo partido metes 4 goles y tu compañero mete 1...\n\n¿Cuántos goles hizo el equipo en total?', options: ['3 goles', '4 goles', '5 goles'], correctIndex: 2, skillTag: 'Cálculo Mental' }
    ]
  },
  "3": {
    id: "3", type: "diagnostic", title: "Campaña Diagnóstica Inicial", theme: "general", xpReward: 200,
    explanation: [
      { type: 'text', content: 'Bienvenido al **Modo Campaña** 🛡️' },
      { type: 'text', content: 'Esta misión evaluará tus habilidades actuales para crear tu Perfil de Héroe. ¡Haz tu mejor esfuerzo, no hay problema si te equivocas!' }
    ],
    games: [
      { type: 'multiple_choice', question: 'Lee con atención:\n"Un tren sale a las 3 PM. Juanito debe tomar ese tren, pero tarda 2 horas en llegar a la estación caminando."\n\n¿A qué hora debe salir Juanito de su casa como máximo?', options: ['1:00 PM', '2:00 PM', '3:00 PM'], correctIndex: 0, skillTag: 'Lectura Comprensiva' },
      { type: 'multiple_choice', question: 'Cálculo Rápido:\n\n**12 x 5** = ?', options: ['50', '60', '72'], correctIndex: 1, skillTag: 'Cálculo Mental' },
      { type: 'multiple_choice', question: '¿Cuántos lados tiene un hexágono?', options: ['5 lados', '6 lados', '8 lados'], correctIndex: 1, skillTag: 'Geometría' }
    ]
  }
};

const initialResources: Record<string, SharedResource> = {
  "r1": { id: "r1", title: "Video: ¿Qué son las fracciones?", type: "video", url: "https://youtube.com", xpReward: 20 },
  "r2": { id: "r2", title: "Guía PDF: Ejercicios de Sumas Espaciales", type: "pdf", url: "https://drive.google.com", xpReward: 30 }
};

const initialStudents = [
  { id: '1', name: 'Pedro', level: 2, xp: 110, coins: 25, streak: 3, interests: ['Espacio', 'Fútbol'], completedModules: ['1'], assignedModules: ['1', '2', '3'], nextClass: '2026-06-12T16:00', meetLink: 'https://meet.google.com/abc-defg-hij', isRecurringClass: true, skills: { 'Cálculo Mental': 80, 'Lectura Comprensiva': 40, 'Geometría': 60, 'Lógica Matemática': 90 }, assignedResources: ['r1', 'r2'], viewedResources: ['r1'] },
  { id: '2', name: 'Sofía', level: 4, xp: 350, coins: 120, streak: 5, interests: ['Animales', 'Ciencia'], completedModules: ['2'], assignedModules: ['1', '2', '3'], nextClass: '2026-06-15T17:30', meetLink: 'https://meet.google.com/xyz-uvw-qrs', isRecurringClass: false, skills: {}, assignedResources: ['r1'], viewedResources: [] },
];

// --- ESTADO GLOBAL ---
export type UserState = {
  id: string;
  name: string;
  xp: number;
  level: number;
  streak: number;
  coins: number;
  completedModules: string[];
  assignedModules: string[];
  interests: string[];
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
  addXp: (amount: number) => void;
  addCoins: (amount: number, studentId?: string) => void;
  markModuleCompleted: (id: string) => void;
  updateSkills: (sessionSkills: Record<string, { correct: number, total: number }>) => void;
  markResourceViewed: (id: string, xpReward: number) => void;
  deleteStudent: (id: string) => void;
};

const UserContext = createContext<UserContextType | null>(null);

function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser debe usarse dentro de UserProvider");
  return ctx;
}

const XP_PER_LEVEL = 100;

function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserState | null>(null);
  const [allStudents, setAllStudents] = useState<UserState[]>([]);
  const [modules, setModules] = useState<Record<string, LearningModule>>({});
  const [resources, setResources] = useState<Record<string, SharedResource>>({});

  useEffect(() => {
    // Inicializar DB si está vacía
    const initializeDb = async () => {
      try {
        const snap = await getDocs(collection(db, "students"));
        if (snap.empty) {
          console.log("Inicializando base de datos en la nube...");
          for (const s of initialStudents) await setDoc(doc(db, "students", s.id), s);
          for (const m of Object.values(initialModules)) await setDoc(doc(db, "modules", m.id), m);
          for (const r of Object.values(initialResources)) await setDoc(doc(db, "resources", r.id), r);
          console.log("Inicialización completa");
        }
      } catch (err) {
        console.error("Error conectando a Firebase:", err);
      }
    };
    initializeDb();

    // Listeners en tiempo real
    const unsubStudents = onSnapshot(collection(db, "students"), (snap) => {
      const studentsData = snap.docs.map(d => ({id: d.id, ...d.data()} as UserState));
      setAllStudents(studentsData);
      const pedro = studentsData.find(s => s.id === '1');
      if (pedro) setUser(pedro);
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
    await updateDoc(doc(db, "students", user.id), {
      completedModules: [...user.completedModules, id]
    });
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
    
    await updateDoc(doc(db, "students", user.id), {
      xp: newXp,
      level: newLevel,
      viewedResources: [...user.viewedResources, id]
    });
  };

  const deleteStudent = async (id: string) => {
    await deleteDoc(doc(db, "students", id));
  };

  return (
    <UserContext.Provider value={{ user, allStudents, modules, resources, addXp, addCoins, markModuleCompleted, updateSkills, markResourceViewed, deleteStudent }}>
      {children}
    </UserContext.Provider>
  );
}

// --- UTILS ---
const formatNextClass = (dateString: string) => {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const formatted = d.toLocaleString('es-ES', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    return formatted.replace(',', ' -') + ' hrs';
  } catch(e) {
    return dateString;
  }
};

const Fraction = ({ num, den }: { num: string, den: string }) => (
  <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', verticalAlign: 'middle', lineHeight: '1.1', margin: '0 0.2rem' }}>
    <span style={{ padding: '0 0.2rem' }}>{num}</span>
    <span style={{ borderTop: '2px solid currentColor', width: '100%' }}></span>
    <span style={{ padding: '0 0.2rem' }}>{den}</span>
  </span>
);

const renderFractions = (text: string) => {
  const parts = text.split(/(\d+\/\d+)/g);
  return parts.map((part, i) => {
    if (part.match(/^\d+\/\d+$/)) {
      const [num, den] = part.split('/');
      return <Fraction key={i} num={num} den={den} />;
    }
    return part;
  });
};

const renderText = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{renderFractions(part.slice(2, -2))}</strong>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{renderFractions(part.slice(1, -1))}</em>;
    return <span key={i}>{renderFractions(part)}</span>;
  });
};


// --- COMPONENTES UI: ESTUDIANTE ---

function Login() {
  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h1 className="text-gradient">TutorApp</h1>
        <p className="text-secondary" style={{ marginBottom: '2rem' }}>Ingresa para continuar tu aventura de aprendizaje.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input type="password" placeholder="Tu PIN Secreto" style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--bg-elevated)', background: 'var(--bg-secondary)', color: 'white', fontSize: '1rem', outline: 'none', textAlign: 'center', letterSpacing: '0.2em' }} />
          <Link to="/dashboard" className="btn btn-primary">Entrar como Estudiante</Link>
          <Link to="/teacher" className="btn btn-secondary" style={{marginTop: '1rem', border: 'none'}}>Acceso Profesores</Link>
        </div>
      </motion.div>
    </div>
  );
}

function Dashboard() {
  const { user, modules, resources, markResourceViewed } = useUser();
  if (!user) return <div className="container" style={{padding: '2rem'}}>Cargando perfil desde Firebase...</div>;

  const currentLevelXp = user.xp % XP_PER_LEVEL;
  const progressPercent = (currentLevelXp / XP_PER_LEVEL) * 100;

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h2>Hola, <span className="text-gradient">{user.name}</span> 👋</h2>
          <p className="text-secondary">Intereses: {user.interests.join(', ')}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.5rem 1rem', borderRadius: '999px', border: '1px solid rgba(255,215,0,0.3)' }}>
            <span style={{ color: '#FBBF24' }}>💰</span><strong style={{ fontSize: '0.875rem', color: '#FBBF24' }}>{user.coins} Monedas</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.5rem 1rem', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: 'var(--color-warning)' }}>🔥</span><strong style={{ fontSize: '0.875rem' }}>Racha: {user.streak} Días</strong>
          </div>
          <Link to="/" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>Salir</Link>
        </div>
      </header>

      {user.nextClass && (
        <div style={{ background: 'var(--bg-card)', padding: '1rem 1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', border: '1px solid var(--accent-primary)', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(139, 92, 246, 0.2)', padding: '0.75rem', borderRadius: '12px', color: 'var(--accent-primary)', fontSize: '1.5rem' }}>📅</div>
            <div>
              <h4 style={{ margin: 0, color: 'white', marginBottom: '0.25rem' }}>Próxima Clase por Meet {user.isRecurringClass && <span style={{fontSize: '1.2rem', marginLeft: '0.25rem'}} title="Se repite todas las semanas">🔁</span>}</h4>
              <p className="text-secondary" style={{ margin: 0, fontSize: '0.875rem', textTransform: 'capitalize' }}>{formatNextClass(user.nextClass)}</p>
            </div>
          </div>
          {user.meetLink && (
            <a href={user.meetLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', textDecoration: 'none' }}>
              📹 Unirse a la Videollamada
            </a>
          )}
        </div>
      )}

      <section className="card" style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
        <div style={{ background: 'var(--gradient-primary)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', color: 'white', flexShrink: 0, boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)' }}>{user.level}</div>
        <div style={{ flexGrow: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <strong style={{ color: 'var(--color-xp)', fontSize: '1.1rem' }}>{currentLevelXp} / {XP_PER_LEVEL} XP</strong>
            <span className="text-secondary" style={{ fontSize: '0.875rem', fontWeight: '500' }}>Para el Nivel {user.level + 1}</span>
          </div>
          <div style={{ background: 'var(--bg-elevated)', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 1, ease: "easeOut" }} style={{ height: '100%', background: 'var(--gradient-xp)' }} />
          </div>
        </div>
      </section>

      {/* AULA VIRTUAL */}
      <section style={{ marginBottom: '4rem' }}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>🎒</span> Aula Virtual (Material de Apoyo)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {user.assignedResources.map(resId => {
            const res = resources[resId];
            if (!res) return null;
            const isViewed = user.viewedResources.includes(res.id);
            const icon = res.type === 'video' ? '▶️' : (res.type === 'pdf' ? '📄' : '🔗');
            return (
              <a key={res.id} href={res.url} target="_blank" rel="noopener noreferrer" onClick={() => markResourceViewed(res.id, res.xpReward)} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <motion.div whileHover={{ y: -5 }} className="card" style={{ cursor: 'pointer', borderTop: `4px solid ${isViewed ? 'var(--color-success)' : 'var(--accent-secondary)'}`, position: 'relative', overflow: 'hidden', opacity: isViewed ? 0.7 : 1 }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, padding: '0.5rem 1rem', background: isViewed ? 'var(--color-success)' : 'var(--accent-secondary)', color: 'white', fontSize: '0.75rem', fontWeight: 'bold', borderBottomLeftRadius: '16px' }}>{isViewed ? 'Leído ✅' : '¡Nuevo Material!'}</div>
                  <h4 style={{ marginBottom: '0.5rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>{icon}</span> {res.title}</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: isViewed ? 'var(--color-success)' : 'var(--color-xp)', fontWeight: 'bold' }}>
                      {isViewed ? `✨ +${res.xpReward} XP Obtenidos` : `Recompensa: +${res.xpReward} XP`}
                    </span>
                  </div>
                </motion.div>
              </a>
            );
          })}
        </div>
      </section>

      {/* MISIONES PRINCIPALES */}
      <section style={{ marginBottom: '4rem' }}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>📚</span> Misiones Principales y Campañas</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {Object.values(modules).map(mod => {
            const isCompleted = user.completedModules.includes(mod.id);
            const isDiagnostic = mod.type === 'diagnostic';
            return (
              <Link key={mod.id} to={`/module/${mod.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', pointerEvents: isCompleted ? 'none' : 'auto' }}>
                <motion.div whileHover={isCompleted ? {} : { y: -5 }} className="card" style={{ cursor: isCompleted ? 'default' : 'pointer', borderTop: `4px solid ${isCompleted ? 'var(--color-success)' : (isDiagnostic ? '#F43F5E' : 'var(--accent-primary)')}`, position: 'relative', overflow: 'hidden', opacity: isCompleted ? 0.6 : 1 }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, padding: '0.5rem 1rem', background: isCompleted ? 'var(--color-success)' : (isDiagnostic ? '#F43F5E' : 'var(--accent-primary)'), color: 'white', fontSize: '0.75rem', fontWeight: 'bold', borderBottomLeftRadius: '16px' }}>{isCompleted ? 'Completado' : (isDiagnostic ? 'Modo Campaña' : 'Misión Regular')}</div>
                  <h4 style={{ marginBottom: '0.5rem', marginTop: '0.5rem' }}>{mod.title}</h4>
                  <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>Temática: {mod.theme}</p>
                  {!isCompleted && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.875rem', color: isDiagnostic ? '#F43F5E' : 'var(--color-xp)', fontWeight: 'bold' }}>Recompensa: +{mod.xpReward} XP</span>
                      <span style={{ fontSize: '1.2rem' }}>{isDiagnostic ? '🛡️' : '🎮'}</span>
                    </div>
                  )}
                  {isCompleted && <p style={{ color: 'var(--color-success)', fontWeight: 'bold', fontSize: '0.875rem' }}>✨ +{mod.xpReward} XP Obtenidos</p>}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ARENA */}
      <section>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>⚔️</span> Arena de Entrenamiento</h3>
        <p className="text-secondary" style={{ marginBottom: '1.5rem' }}>Practica de forma infinita y gana monedas de oro.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <Link to="/arena/fracciones" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}><motion.div whileHover={{ y: -5 }} className="card" style={{ cursor: 'pointer', borderTop: `4px solid #FBBF24` }}><div style={{ position: 'absolute', top: 0, right: 0, padding: '0.5rem 1rem', background: '#FBBF24', color: 'black', fontSize: '0.75rem', fontWeight: 'bold', borderBottomLeftRadius: '16px' }}>Infinito</div><h4 style={{ marginBottom: '0.5rem', marginTop: '0.5rem' }}>Fracciones Rápidas</h4><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}><span style={{ fontSize: '0.875rem', color: '#FBBF24', fontWeight: 'bold' }}>+5 💰 por acierto</span><span style={{ fontSize: '1.2rem' }}>♾️</span></div></motion.div></Link>
          <Link to="/arena/multiplicacion" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}><motion.div whileHover={{ y: -5 }} className="card" style={{ cursor: 'pointer', borderTop: `4px solid #FBBF24` }}><div style={{ position: 'absolute', top: 0, right: 0, padding: '0.5rem 1rem', background: '#FBBF24', color: 'black', fontSize: '0.75rem', fontWeight: 'bold', borderBottomLeftRadius: '16px' }}>Infinito</div><h4 style={{ marginBottom: '0.5rem', marginTop: '0.5rem' }}>Tablas de Multiplicar</h4><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}><span style={{ fontSize: '0.875rem', color: '#FBBF24', fontWeight: 'bold' }}>+5 💰 por acierto</span><span style={{ fontSize: '1.2rem' }}>♾️</span></div></motion.div></Link>
        </div>
      </section>
    </div>
  );
}

function ModuleView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, modules, addXp, markModuleCompleted, updateSkills } = useUser();
  const [step, setStep] = useState(0);
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [sessionSkills, setSessionSkills] = useState<Record<string, { correct: number, total: number }>>({});

  if (!user) return <div className="container">Cargando...</div>;

  const moduleData = id ? modules[id] : null;

  if (!moduleData) return <div className="container" style={{padding: '2rem'}}>Módulo no encontrado.</div>;

  const currentGame = moduleData.games[currentGameIndex];
  const isDiagnostic = moduleData.type === 'diagnostic';

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null) return; 
    setSelectedAnswer(index);
    
    const isCorrect = index === currentGame.correctIndex;
    const skill = currentGame.skillTag || 'General';

    const newSessionSkills = {
      ...sessionSkills,
      [skill]: {
        correct: (sessionSkills[skill]?.correct || 0) + (isCorrect ? 1 : 0),
        total: (sessionSkills[skill]?.total || 0) + 1
      }
    };
    setSessionSkills(newSessionSkills);

    const proceed = () => {
      setSelectedAnswer(null);
      if (currentGameIndex < moduleData.games.length - 1) {
        setCurrentGameIndex(prev => prev + 1);
      } else {
        setStep(2);
        if (!user.completedModules.includes(moduleData.id)) {
          addXp(moduleData.xpReward);
          markModuleCompleted(moduleData.id);
          if (isDiagnostic) updateSkills(newSessionSkills);
        }
      }
    };

    if (isDiagnostic) setTimeout(proceed, 1500);
    else {
      if (isCorrect) setTimeout(proceed, 1500);
      else setTimeout(() => setSelectedAnswer(null), 1000);
    }
  };

  const radarData = Object.keys(sessionSkills).map(key => ({
    subject: key,
    A: Math.round((sessionSkills[key].correct / sessionSkills[key].total) * 100),
    fullMark: 100,
  }));

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem', maxWidth: '800px' }}>
      <button onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={{ marginBottom: '2rem', padding: '0.5rem 1rem' }}>← Abandonar Misión</button>
      
      {step === 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '2.5rem' }}>{isDiagnostic ? '🛡️' : (moduleData.theme === 'espacio' ? '🚀' : '⚽')}</span>
            <h2 style={{ margin: 0 }}>{moduleData.title}</h2>
          </div>
          {moduleData.explanation.map((block, idx) => {
            if (block.type === 'text') return <p key={idx} style={{ fontSize: '1.1rem' }}>{renderText(block.content)}</p>;
            if (block.type === 'highlight') return (
              <div key={idx} style={{ background: 'var(--bg-elevated)', padding: '2rem', borderRadius: '12px', margin: '2rem 0', textAlign: 'center' }}>
                <h3 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{block.title}</h3>
                <p className="text-secondary" style={{ fontSize: '1.1rem' }}>{renderText(block.content)}</p>
              </div>
            );
            return null;
          })}
          <button onClick={() => setStep(1)} className="btn btn-primary" style={{ width: '100%', fontSize: '1.1rem', padding: '1rem', marginTop: '1rem' }}>
            {isDiagnostic ? 'Iniciar Evaluación' : '¡Entendido, vamos al reto!'}
          </button>
        </motion.div>
      )}

      {step === 1 && (
        <motion.div key={currentGameIndex} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0 }}>Pregunta {currentGameIndex + 1} de {moduleData.games.length}</h3>
            <span style={{ background: 'var(--bg-elevated)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.875rem', color: isDiagnostic ? '#F43F5E' : 'inherit' }}>
              {isDiagnostic ? 'Campaña' : currentGame.type}
            </span>
          </div>
          <div style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid var(--bg-elevated)' }}>
            <p style={{ fontSize: '1.2rem', margin: 0, whiteSpace: 'pre-line' }}>{renderText(currentGame.question)}</p>
          </div>
          {currentGame.type === 'multiple_choice' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {currentGame.options.map((ans, idx) => {
                let bgColor = 'var(--bg-elevated)';
                let borderColor = 'transparent';
                if (selectedAnswer === idx) {
                  if (idx === currentGame.correctIndex) { bgColor = 'var(--color-success)'; borderColor = 'var(--color-success)'; } 
                  else { bgColor = 'var(--color-error)'; borderColor = 'var(--color-error)'; }
                } else if (selectedAnswer !== null && idx === currentGame.correctIndex && isDiagnostic) {
                  borderColor = 'var(--color-success)';
                }
                
                return (
                  <button key={idx} onClick={() => handleAnswer(idx)}
                    style={{ padding: '1.25rem', borderRadius: '12px', background: bgColor, border: '2px solid', borderColor, color: 'white', cursor: 'pointer', fontSize: '1.1rem', transition: 'all 0.2s', textAlign: 'left', fontWeight: '500', display: 'flex', alignItems: 'center', minHeight: '60px' }}>
                    {renderText(ans)}
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {step === 2 && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <motion.div initial={{ y: -20 }} animate={{ y: 0 }} transition={{ type: 'spring', bounce: 0.5 }} style={{ fontSize: '5rem', marginBottom: '1rem' }}>🏆</motion.div>
          <h2 className="text-gradient-streak" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>¡Misión Cumplida!</h2>
          <p className="text-secondary" style={{ fontSize: '1.1rem', marginBottom: '2.5rem' }}>Has ganado <strong style={{color: 'var(--color-xp)'}}>+{moduleData.xpReward} XP</strong>.</p>
          
          {isDiagnostic && radarData.length > 0 && (
            <div style={{ marginTop: '2rem', marginBottom: '3rem', background: 'var(--bg-primary)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--bg-elevated)' }}>
              <h3 style={{marginBottom: '1rem'}}>Tu Perfil de Héroe Generado 📊</h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="var(--bg-elevated)" />
                    <PolarAngleAxis dataKey="subject" tick={{fill: 'var(--text-secondary)', fontSize: 12}} />
                    <Radar name="Habilidades" dataKey="A" stroke="var(--accent-primary)" fill="var(--accent-primary)" fillOpacity={0.5} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>Volver al Mando Central</button>
        </motion.div>
      )}
    </div>
  );
}

function ArenaView() {
  const { topic } = useParams();
  const navigate = useNavigate();
  const { addCoins } = useUser();
  const [exercise, setExercise] = useState(() => generateMathExercise(topic || 'multiplicacion'));
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [sessionCoins, setSessionCoins] = useState(0);
  const [streak, setStreak] = useState(0);

  const handleNext = () => {
    setSelectedAnswer(null);
    setExercise(generateMathExercise(topic || 'multiplicacion'));
  };

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null) return; 
    setSelectedAnswer(index);
    if (index === exercise.correctIndex) {
      addCoins(5);
      setSessionCoins(prev => prev + 5);
      setStreak(s => s + 1);
      setTimeout(handleNext, 1000); 
    } else {
      setStreak(0);
      setTimeout(() => setSelectedAnswer(null), 1000);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem', maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>← Salir de la Arena</button>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ color: '#FBBF24', fontWeight: 'bold' }}>Racha x{streak}</div>
          <div style={{ color: '#FBBF24', fontWeight: 'bold' }}>+ {sessionCoins} 💰 Obtenidas</div>
        </div>
      </div>

      <motion.div key={exercise.question} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0 }}>Practicando: {topic === 'fracciones' ? 'Fracciones Rápidas' : 'Multiplicación'} ⚔️</h3>
          <span style={{ background: 'var(--bg-elevated)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.875rem' }}>Modo: Infinito</span>
        </div>
        <div style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid var(--bg-elevated)' }}>
          <p style={{ fontSize: '1.2rem', margin: 0, whiteSpace: 'pre-line' }}>{renderText(exercise.question)}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {exercise.options.map((ans, idx) => {
            let bgColor = 'var(--bg-elevated)';
            let borderColor = 'transparent';
            if (selectedAnswer === idx) {
              if (idx === exercise.correctIndex) { bgColor = 'var(--color-success)'; borderColor = 'var(--color-success)'; } 
              else { bgColor = 'var(--color-error)'; borderColor = 'var(--color-error)'; }
            }
            return (
              <button key={idx} onClick={() => handleAnswer(idx)}
                style={{ padding: '1.25rem', borderRadius: '12px', background: bgColor, border: '2px solid', borderColor, color: 'white', cursor: 'pointer', fontSize: '1.1rem', transition: 'all 0.2s', textAlign: 'left', fontWeight: '500', display: 'flex', alignItems: 'center', minHeight: '60px' }}>
                {renderText(ans)}
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}


// --- COMPONENTES UI: PROFESORA (ADMIN) ---

function TeacherDashboard() {
  const navigate = useNavigate();
  const { allStudents } = useUser();

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
       <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem'}}>
         <div>
           <h2 style={{margin: 0}}>Panel de Profesora 👩‍🏫</h2>
           <p className="text-secondary" style={{margin: 0, marginTop: '0.5rem'}}>Directorio de Estudiantes Activos (En la Nube ☁️)</p>
         </div>
         <Link to="/" className="btn btn-secondary">← Salir al Login</Link>
       </header>

       {allStudents.length === 0 ? (
         <div style={{padding: '2rem', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '12px'}}>
           Cargando estudiantes desde Firebase...
         </div>
       ) : (
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {allStudents.map(student => (
              <motion.div 
                whileHover={{y: -5}} 
                key={student.id} 
                className="card" 
                style={{cursor: 'pointer', borderTop: '4px solid var(--color-xp)'}} 
                onClick={() => navigate(`/teacher/student/${student.id}`)}
              >
                 <h3 style={{marginTop: 0}}>{student.name}</h3>
                 <p className="text-secondary" style={{fontSize: '0.875rem', marginBottom: '1.5rem'}}>Intereses: {student.interests.join(', ')}</p>
                 
                 <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: '8px'}}>
                   <span style={{fontWeight: 'bold', color: 'var(--color-xp)'}}>Nivel {student.level}</span>
                   <span style={{color: '#FBBF24'}}>💰 {student.coins}</span>
                   <span>🔥 {student.streak}</span>
                 </div>
              </motion.div>
            ))}
         </div>
       )}
    </div>
  )
}

function TeacherStudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { allStudents, modules, resources, deleteStudent, addCoins } = useUser();
  const student = allStudents.find(s => s.id === id);
  const [viewChart, setViewChart] = useState<'radar' | 'bar'>('radar');

  if (!student) return <div className="container" style={{padding: '2rem'}}>Cargando o Estudiante no encontrado...</div>;

  const chartData = Object.keys(student.skills || {}).map(key => ({
    subject: key,
    A: student.skills[key],
    fullMark: 100,
  }));

  const handleDelete = async () => {
    if (window.confirm(`¿Estás segura de que quieres borrar a ${student.name} de la base de datos?`)) {
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
            <p className="text-secondary" style={{margin: 0, marginTop: '0.5rem'}}>Monitoreo de Progreso (Sincronizado ☁️)</p>
          </div>
          <span className="text-gradient" style={{fontSize: '1.5rem', fontWeight: 'bold'}}>Nivel {student.level}</span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
           <div style={{background: 'var(--bg-elevated)', padding: '1rem', borderRadius: '8px', textAlign: 'center'}}>
             <div style={{color: 'var(--color-xp)', fontSize: '1.5rem', fontWeight: 'bold'}}>{student.xp}</div>
             <div className="text-secondary" style={{fontSize: '0.875rem'}}>XP Total</div>
           </div>
           <div style={{background: 'var(--bg-elevated)', padding: '1rem', borderRadius: '8px', textAlign: 'center'}}>
             <div style={{color: '#FBBF24', fontSize: '1.5rem', fontWeight: 'bold'}}>{student.coins}</div>
             <div className="text-secondary" style={{fontSize: '0.875rem'}}>Monedas Obtenidas</div>
           </div>
           <div style={{background: 'var(--bg-elevated)', padding: '1rem', borderRadius: '8px', textAlign: 'center'}}>
             <div style={{color: 'var(--color-warning)', fontSize: '1.5rem', fontWeight: 'bold'}}>{student.streak}</div>
             <div className="text-secondary" style={{fontSize: '0.875rem'}}>Días de Racha</div>
           </div>
           {student.nextClass && (
             <div style={{background: 'var(--bg-elevated)', padding: '1rem', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--accent-primary)'}}>
               <div style={{color: 'var(--accent-primary)', fontSize: '1.1rem', fontWeight: 'bold', textTransform: 'capitalize'}}>{formatNextClass(student.nextClass)}</div>
               <div className="text-secondary" style={{fontSize: '0.875rem'}}>📅 Próxima Clase {student.isRecurringClass && <span style={{color: '#FBBF24'}} title="Todas las semanas">🔁</span>}</div>
             </div>
           )}
        </div>

        {chartData.length > 0 && (
          <div style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid var(--bg-elevated)' }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
              <h3 style={{margin: 0}}>Perfil de Habilidades (Diagnóstico)</h3>
              <div style={{display: 'flex', gap: '0.5rem'}}>
                <button onClick={() => setViewChart('radar')} className={`btn ${viewChart === 'radar' ? 'btn-primary' : 'btn-secondary'}`} style={{padding: '0.25rem 0.75rem', fontSize: '0.875rem'}}>Telaraña</button>
                <button onClick={() => setViewChart('bar')} className={`btn ${viewChart === 'bar' ? 'btn-primary' : 'btn-secondary'}`} style={{padding: '0.25rem 0.75rem', fontSize: '0.875rem'}}>Barras</button>
              </div>
            </div>
            
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                {viewChart === 'radar' ? (
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                    <PolarGrid stroke="var(--bg-elevated)" />
                    <PolarAngleAxis dataKey="subject" tick={{fill: 'var(--text-primary)', fontSize: 12}} />
                    <Radar name="Proficiencia %" dataKey="A" stroke="var(--accent-primary)" fill="var(--accent-primary)" fillOpacity={0.6} />
                    <Tooltip contentStyle={{backgroundColor: 'var(--bg-card)', border: 'none', borderRadius: '8px'}} />
                  </RadarChart>
                ) : (
                  <BarChart data={chartData} layout="vertical" margin={{top: 5, right: 30, left: 20, bottom: 5}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-elevated)" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} stroke="var(--text-secondary)" />
                    <YAxis dataKey="subject" type="category" stroke="var(--text-secondary)" width={100} tick={{fontSize: 12}} />
                    <Tooltip contentStyle={{backgroundColor: 'var(--bg-card)', border: 'none', borderRadius: '8px'}} />
                    <Bar dataKey="A" fill="var(--accent-primary)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* AULA VIRTUAL (Profesora) */}
        <div style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--accent-secondary)', marginBottom: '2rem' }}>
          <h3 style={{marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}><span>🎒</span> Aula Virtual: Material Compartido</h3>
          
          {student.assignedResources && student.assignedResources.length > 0 ? (
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem'}}>
              {student.assignedResources.map(resId => {
                const isViewed = student.viewedResources.includes(resId);
                const resData = resources[resId];
                if (!resData) return null;
                const icon = resData.type === 'video' ? '▶️' : (resData.type === 'pdf' ? '📄' : '🔗');
                return (
                  <div key={resId} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)', padding: '1.25rem', borderRadius: '8px'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                      <span style={{fontSize: '1.5rem'}}>{icon}</span>
                      <div>
                        <div style={{fontWeight: 'bold', marginBottom: '0.25rem', fontSize: '1.1rem'}}>{resData.title}</div>
                        <a href={resData.url} target="_blank" rel="noopener noreferrer" className="text-secondary" style={{fontSize: '0.875rem', textDecoration: 'underline'}}>Ver enlace original</a>
                      </div>
                    </div>
                    <div>
                      {isViewed 
                        ? <span style={{background: 'rgba(16, 185, 129, 0.2)', color: 'var(--color-success)', padding: '0.5rem 1rem', borderRadius: '999px', fontSize: '0.875rem', fontWeight: 'bold'}}>Visto por el Alumno ✅</span>
                        : <span style={{background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-secondary)', padding: '0.5rem 1rem', borderRadius: '999px', fontSize: '0.875rem', fontWeight: 'bold'}}>No lo ha abierto ⏳</span>
                      }
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-secondary" style={{marginBottom: '2rem'}}>No le has asignado recursos adicionales a este estudiante.</p>
          )}

          {/* AGREGAR NUEVO RECURSO */}
          <div style={{ background: 'var(--bg-elevated)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--bg-card)' }}>
            <h4 style={{margin: '0 0 1rem 0'}}>+ Compartir Nuevo Material</h4>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <select style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--bg-secondary)', background: 'var(--bg-primary)', color: 'white', fontSize: '0.875rem' }}>
                <option value="video">Video (YouTube)</option>
                <option value="pdf">Documento PDF (Drive)</option>
                <option value="link">Sitio Web</option>
              </select>
              <input type="text" placeholder="Título (Ej: Video Ecuaciones)" style={{ flex: 1, minWidth: '150px', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--bg-secondary)', background: 'var(--bg-primary)', color: 'white', fontSize: '0.875rem' }} />
              <input type="url" placeholder="Pegar URL aquí..." style={{ flex: 2, minWidth: '200px', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--bg-secondary)', background: 'var(--bg-primary)', color: 'white', fontSize: '0.875rem' }} />
              <input type="number" placeholder="XP" defaultValue={20} style={{ width: '80px', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--bg-secondary)', background: 'var(--bg-primary)', color: 'white', fontSize: '0.875rem' }} title="Recompensa de XP" />
              <button className="btn btn-primary" onClick={() => alert('Pronto se guardará en la nube.')} style={{padding: '0.75rem 1rem', background: 'var(--accent-secondary)'}}>Compartir Material</button>
            </div>
          </div>
        </div>

        {/* CONFIGURAR PROXIMA CLASE */}
        <div style={{ background: 'var(--bg-elevated)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--bg-card)', marginBottom: '2rem' }}>
           <h4 style={{margin: '0 0 1rem 0'}}>Configurar Próxima Clase</h4>
           <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
             <input type="datetime-local" defaultValue={student.nextClass} style={{ flex: 1, minWidth: '150px', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--bg-secondary)', background: 'var(--bg-primary)', color: 'white', fontSize: '0.875rem', colorScheme: 'dark' }} />
             <input type="url" defaultValue={student.meetLink} placeholder="Link de Google Meet" style={{ flex: 2, minWidth: '200px', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--bg-secondary)', background: 'var(--bg-primary)', color: 'white', fontSize: '0.875rem' }} />
             <button className="btn btn-primary" onClick={() => alert('Pronto se guardará en la nube.')} style={{padding: '0.75rem 1rem'}}>Guardar Clase</button>
           </div>
           <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <input type="checkbox" id="recurring" defaultChecked={student.isRecurringClass} style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }} />
             <label htmlFor="recurring" style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Repetir este horario todas las semanas automáticamente.</label>
           </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', borderTop: '1px solid var(--bg-elevated)', paddingTop: '1.5rem' }}>
           <button onClick={() => addCoins(50, student.id)} className="btn btn-secondary" style={{borderColor: '#FBBF24', color: '#FBBF24'}}>🎁 Regalar 50 Monedas Manualmente</button>
           <button className="btn btn-primary" style={{background: 'var(--color-success)', borderColor: 'var(--color-success)'}}>+ Pegar nuevo JSON y Asignar Módulo</button>
           <button className="btn btn-secondary" onClick={handleDelete} style={{borderColor: 'var(--color-error)', color: 'var(--color-error)', marginLeft: 'auto'}}>🗑️ Borrar Estudiante</button>
        </div>
      </div>

      <div className="card">
        <h3 style={{marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}><span>📚</span> Módulos Asignados al Alumno</h3>
        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          {student.assignedModules.map(modId => {
            const isCompleted = student.completedModules.includes(modId);
            const modData = modules[modId];
            return (
              <div key={modId} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--bg-elevated)'}}>
                <div>
                  <div style={{fontWeight: 'bold', marginBottom: '0.25rem', fontSize: '1.1rem'}}>{modData?.title || 'Módulo Desconocido'}</div>
                  <div className="text-secondary" style={{fontSize: '0.875rem'}}>Tipo: {modData?.type === 'diagnostic' ? 'Evaluación' : 'Estándar'}</div>
                </div>
                <div>
                  {isCompleted 
                    ? <span style={{background: 'rgba(16, 185, 129, 0.2)', color: 'var(--color-success)', padding: '0.5rem 1rem', borderRadius: '999px', fontSize: '0.875rem', fontWeight: 'bold'}}>Completado ✅</span>
                    : <span style={{background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-secondary)', padding: '0.5rem 1rem', borderRadius: '999px', fontSize: '0.875rem', fontWeight: 'bold'}}>Pendiente ⏳</span>
                  }
                </div>
              </div>
            )
          })}
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
          <Route path="/arena/:topic" element={<ArenaView />} />
          <Route path="/teacher" element={<TeacherDashboard />} />
          <Route path="/teacher/student/:id" element={<TeacherStudentDetail />} />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;
