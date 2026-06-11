import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useUser, XP_PER_LEVEL, SkillsChart } from '../App';
import { db } from '../firebase';
import { updateDoc, doc } from 'firebase/firestore';
import { StickerAlbum, STICKER_DB } from './StickerAlbum';

export function WorldCupDashboard() {
  const { user, modules, logout } = useUser();
  const navigate = useNavigate();
  const [showAlbum, setShowAlbum] = useState(false);
  
  if (!user) {
    navigate('/');
    return null;
  }

  const currentLevelXp = user.xp % XP_PER_LEVEL;
  const progressPercent = (currentLevelXp / XP_PER_LEVEL) * 100;

  const mainMissions = user.assignedModules.filter(id => modules[id] && !modules[id].isInfinite);
  const infiniteMissions = user.assignedModules.filter(id => modules[id] && modules[id].isInfinite);

  const buyPack = async (): Promise<number[]> => {
    if (user.coins < 50) return [];
    
    // Generar 3 láminas aleatorias (pesos: 80% star, 15% shield, 5% special)
    const pulled = [];
    for(let i=0; i<3; i++) {
        const rand = Math.random();
        let type = 'star';
        if (rand > 0.8) type = 'shield';
        if (rand > 0.95) type = 'special';
        
        const possible = STICKER_DB.filter(s => s.type === type);
        const selected = possible[Math.floor(Math.random() * possible.length)];
        pulled.push(selected.id);
    }
    
    const newStickers = [...(user.stickers || []), ...pulled];
    const newCoins = user.coins - 50;
    
    // Descontar monedas temporalmente en UI (idealmente usar el hook, pero updateDoc dispara el onSnapshot)
    await updateDoc(doc(db, "students", user.id), { 
        coins: newCoins,
        stickers: newStickers 
    });
    
    return pulled;
  };

  const sellDuplicate = async (id: number) => {
    const current = user.stickers || [];
    const index = current.indexOf(id);
    if (index > -1) {
        const newStickers = [...current];
        newStickers.splice(index, 1);
        await updateDoc(doc(db, "students", user.id), {
            coins: user.coins + 10,
            stickers: newStickers
        });
        alert('Vendiste la lámina por 10 monedas en el Mercado de Pases.');
    }
  };

  // Generar pelotas de fútbol para la barra de XP
  const ballsCount = Math.floor(progressPercent / 10);
  const balls = Array.from({length: ballsCount}).map((_, i) => i);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#064E3B', backgroundImage: 'radial-gradient(circle at 50% 50%, #065F46 0%, #064E3B 100%)', color: 'white', position: 'relative', overflow: 'hidden' }}>
      
      {/* Líneas de Cancha de Fondo */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '300px', height: '300px', border: '5px solid rgba(255,255,255,0.1)', borderRadius: '50%', pointerEvents: 'none' }}></div>
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '5px', backgroundColor: 'rgba(255,255,255,0.1)', pointerEvents: 'none' }}></div>

      {showAlbum && <StickerAlbum user={user} onBuyPack={buyPack} onSellDuplicate={sellDuplicate} onClose={() => setShowAlbum(false)} />}

      <div className="container" style={{ position: 'relative', zIndex: 10, paddingTop: '2rem', paddingBottom: '2rem' }}>
        
        {/* HEADER MUNDIAL */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: '2.5rem', letterSpacing: '2px', textTransform: 'uppercase', margin: 0 }}>HOLA, {user.name} <span style={{fontSize:'1.5rem'}}>👋</span></h1>
          </div>
          
          <img src="https://upload.wikimedia.org/wikipedia/en/thumb/e/e3/2022_FIFA_World_Cup.svg/200px-2022_FIFA_World_Cup.svg.png" alt="World Cup" style={{ height: '80px', filter: 'brightness(1.5)' }} />

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button onClick={() => setShowAlbum(true)} className="btn" style={{ backgroundColor: '#D97706', color: 'white', border: '2px solid #FBBF24', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
               <span>📖</span> Ver Álbum
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.5)', padding: '0.5rem 1rem', borderRadius: '999px', border: '1px solid #FBBF24' }}>
              <span>💰</span><strong style={{ color: '#FBBF24' }}>{user.coins}</strong>
            </div>
            <button onClick={() => { logout(); navigate('/'); }} className="btn btn-secondary">Salir</button>
          </div>
        </header>

        {/* BARRA DE XP - PELOTAS */}
        <section style={{ marginBottom: '4rem', background: '#022C22', padding: '1.5rem', borderRadius: '16px', border: '2px solid #D97706', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ background: 'linear-gradient(45deg, #FBBF24, #D97706)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 'bold', color: 'white', boxShadow: '0 0 15px rgba(251,191,36,0.5)' }}>
              {user.level}
            </div>
            <div style={{ flexGrow: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontFamily: 'Anton, sans-serif', letterSpacing: '1px' }}>
                <strong style={{ color: '#FBBF24', fontSize: '1.2rem' }}>{currentLevelXp} / {XP_PER_LEVEL} XP</strong>
                <span style={{ color: '#94A3B8' }}>PRÓXIMA FASE: GRUPO {user.level + 1}</span>
              </div>
              <div style={{ background: '#064E3B', height: '16px', borderRadius: '8px', position: 'relative' }}>
                 <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '100%', display: 'flex', alignItems: 'center' }}>
                    <div style={{ height: '4px', width: `${progressPercent}%`, backgroundColor: '#FBBF24', transition: 'width 1s ease' }}></div>
                 </div>
                 <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', transform: 'translateY(-50%)', display: 'flex' }}>
                    {balls.map(b => (
                        <span key={b} style={{ fontSize: '1.5rem', marginLeft: '-0.5rem', transform: 'translateY(-2px)' }}>⚽</span>
                    ))}
                 </div>
              </div>
            </div>
          </div>
        </section>

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            
            {/* PANEL IZQUIERDO: MISIONES */}
            <div style={{ flex: '2', minWidth: '300px' }}>
                <h3 style={{ fontFamily: 'Anton, sans-serif', fontSize: '1.8rem', color: '#FBBF24', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>🏆</span> PARTIDOS PRINCIPALES</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                {mainMissions.map(modId => {
                    const mod = modules[modId];
                    const isCompleted = user.completedModules.includes(mod.id);
                    return (
                        <Link key={mod.id} to={`/module/${mod.id}`} style={{ textDecoration: 'none' }}>
                        <motion.div whileHover={{ scale: 1.02 }} style={{ background: '#111827', borderRadius: '12px', borderTop: `5px solid ${isCompleted ? '#10B981' : '#3B82F6'}`, padding: '1.5rem', opacity: isCompleted ? 0.7 : 1 }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: 'white', fontSize: '1.2rem' }}>{mod.title}</h4>
                            <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginBottom: '1rem' }}>Sede: {mod.theme}</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#FBBF24', fontWeight: 'bold' }}>+{mod.xpReward} XP</span>
                                {isCompleted && <span style={{ fontSize: '0.75rem', background: '#10B981', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>FINALIZADO</span>}
                            </div>
                        </motion.div>
                        </Link>
                    );
                })}
                </div>

                {infiniteMissions.length > 0 && (
                <>
                    <h3 style={{ fontFamily: 'Anton, sans-serif', fontSize: '1.8rem', color: '#FCD34D', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>🏟️</span> ENTRENAMIENTOS DE CAMPO</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {infiniteMissions.map(modId => {
                        const mod = modules[modId];
                        return (
                            <Link key={mod.id} to={`/module/${mod.id}`} style={{ textDecoration: 'none' }}>
                            <motion.div whileHover={{ scale: 1.02 }} style={{ background: '#1E293B', borderRadius: '12px', borderTop: `5px solid #FCD34D`, padding: '1.5rem' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', color: 'white', fontSize: '1.2rem' }}>{mod.title}</h4>
                                <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginBottom: '1rem' }}>Gana monedas para comprar sobres</p>
                                <span style={{ fontSize: '0.8rem', background: '#FCD34D', color: 'black', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>INFINITO</span>
                            </motion.div>
                            </Link>
                        );
                    })}
                    </div>
                </>
                )}
            </div>

            {/* PANEL DERECHO: RADAR Y CLASIFICACIÓN */}
            <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ background: '#111827', borderRadius: '16px', padding: '1.5rem', border: '1px solid #374151' }}>
                   <h3 style={{ fontFamily: 'Anton, sans-serif', color: '#60A5FA', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>📊</span> MI RENDIMIENTO</h3>
                   <div style={{ filter: 'hue-rotate(150deg)' }}>
                      <SkillsChart skills={user.skills} />
                   </div>
                </div>

                <div style={{ background: '#111827', borderRadius: '16px', padding: '1.5rem', border: '1px solid #374151' }}>
                    <h3 style={{ fontFamily: 'Anton, sans-serif', color: '#FCA5A5', margin: '0 0 1rem 0' }}>TABLA DE POSICIONES</h3>
                    <table style={{ width: '100%', color: 'white', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #374151', color: '#94A3B8', textAlign: 'left' }}>
                                <th style={{ paddingBottom: '0.5rem' }}>#</th>
                                <th style={{ paddingBottom: '0.5rem' }}>Jugador</th>
                                <th style={{ paddingBottom: '0.5rem' }}>Nivel</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ padding: '0.5rem 0', color: '#FBBF24', fontWeight: 'bold' }}>1</td>
                                <td style={{ padding: '0.5rem 0' }}>{user.name}</td>
                                <td style={{ padding: '0.5rem 0' }}>Nv. {user.level}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '0.5rem 0', color: '#94A3B8' }}>2</td>
                                <td style={{ padding: '0.5rem 0', color: '#94A3B8' }}>Pedro</td>
                                <td style={{ padding: '0.5rem 0', color: '#94A3B8' }}>Nv. {Math.max(1, user.level - 1)}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '0.5rem 0', color: '#94A3B8' }}>3</td>
                                <td style={{ padding: '0.5rem 0', color: '#94A3B8' }}>Sofía</td>
                                <td style={{ padding: '0.5rem 0', color: '#94A3B8' }}>Nv. {Math.max(1, user.level - 2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}
