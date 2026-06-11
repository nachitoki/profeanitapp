import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { STICKER_DB } from '../data/stickers';

export function StickerAlbum({ user, onBuyPack, onSellDuplicate, onClose }: { user: any, onBuyPack: () => Promise<number[]>, onSellDuplicate: (id: number) => Promise<void>, onClose: () => void }) {
  const [opening, setOpening] = useState(false);
  const [newStickers, setNewStickers] = useState<number[]>([]);
  
  const userStickers = user.stickers || [];
  const ownedCount = new Set(userStickers).size;

  const handleBuy = async () => {
    if (user.coins < 50) return;
    setOpening(true);
    const pulled = await onBuyPack();
    setNewStickers(pulled);
    setTimeout(() => {
      setOpening(false);
    }, 4000);
  };

  const getStickerCount = (id: number) => {
    return userStickers.filter((s: number) => s === id).length;
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 1000, overflowY: 'auto', padding: '2rem' }}>
      <button onClick={onClose} className="btn btn-secondary" style={{ position: 'absolute', top: '1rem', left: '1rem' }}>Volver al Estadio</button>
      
      <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ color: '#FFD700', fontSize: '3rem', fontFamily: 'Anton, sans-serif', textTransform: 'uppercase', marginBottom: '1rem', textShadow: '0 4px 10px rgba(255,215,0,0.3)' }}>Álbum Oficial 2026</h1>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E293B', padding: '1rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid #334155' }}>
          <div>
            <span style={{ fontSize: '1.2rem', color: '#94A3B8' }}>Progreso: </span>
            <strong style={{ fontSize: '1.5rem', color: 'white' }}>{ownedCount} / 50</strong>
          </div>
          <div>
            <span style={{ fontSize: '1.2rem', color: '#94A3B8' }}>Mis Monedas: </span>
            <strong style={{ fontSize: '1.5rem', color: '#FBBF24' }}>💰 {user.coins}</strong>
          </div>
          <button onClick={handleBuy} disabled={user.coins < 50 || opening} className="btn btn-primary" style={{ backgroundColor: user.coins < 50 ? '#64748B' : '#059669', border: user.coins < 50 ? 'none' : '2px solid #34D399', cursor: user.coins < 50 ? 'not-allowed' : 'pointer' }}>
            Comprar Sobre (50 Monedas)
          </button>
        </div>

        {/* Animation Overlay */}
        <AnimatePresence>
          {opening && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1010, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
              <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, -5, 5, -5, 5, 0] }} transition={{ duration: 1, repeat: 3 }} style={{ width: '200px', height: '300px', backgroundColor: '#DC2626', border: '4px solid #FBBF24', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '2rem' }}>
                <span style={{ color: 'white', fontFamily: 'Anton', fontSize: '2rem' }}>FIFA 2026</span>
              </motion.div>
              <h2 style={{ color: 'white' }}>Abriendo sobre...</h2>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recently Pulled Notification */}
        {newStickers.length > 0 && !opening && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ backgroundColor: '#047857', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '2px solid #34D399' }}>
            <h3 style={{ color: 'white', margin: '0 0 1rem 0' }}>¡Nuevas Láminas!</h3>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              {newStickers.map((id, i) => {
                const sData = STICKER_DB.find(s => s.id === id);
                return (
                  <div key={i} style={{ width: '100px', height: '140px', backgroundColor: '#7FE5E4', borderRadius: '8px', border: '2px solid white', overflow: 'hidden', position: 'relative' }}>
                    <img src={sData?.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={sData?.name} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', backgroundColor: '#007A7A', color: 'white', fontSize: '0.6rem', padding: '2px 0', fontWeight: 'bold' }}>{sData?.name}</div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setNewStickers([])} className="btn" style={{ marginTop: '1rem', backgroundColor: 'white', color: '#047857' }}>Aceptar</button>
          </motion.div>
        )}

        {/* Grid de Láminas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
          {STICKER_DB.map(sticker => {
            const count = getStickerCount(sticker.id);
            const isOwned = count > 0;
            return (
              <div key={sticker.id} style={{ opacity: isOwned ? 1 : 0.4, filter: isOwned ? 'none' : 'grayscale(100%)', position: 'relative', width: '100%', aspectRatio: '2.5/3.5', backgroundColor: '#334155', borderRadius: '8px', border: isOwned ? (sticker.type === 'special' ? '3px solid #FBBF24' : '3px solid white') : '3px dashed #64748B', overflow: 'hidden', cursor: isOwned && count > 1 ? 'pointer' : 'default' }}>
                {isOwned ? (
                  <>
                    <img src={sticker.url} alt={sticker.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', backgroundColor: '#007A7A', color: 'white', fontSize: '0.8rem', padding: '4px 0', fontWeight: 'bold', textTransform: 'uppercase' }}>{sticker.name}</div>
                    {count > 1 && (
                      <div onClick={() => onSellDuplicate(sticker.id)} style={{ position: 'absolute', top: '5px', right: '5px', backgroundColor: '#EF4444', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.8rem', fontWeight: 'bold', zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                        x{count}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94A3B8', fontSize: '2rem', fontWeight: 'bold' }}>{sticker.id}</div>
                )}
              </div>
            );
          })}
        </div>
        
        <p style={{ color: '#94A3B8', marginTop: '2rem', fontSize: '0.9rem' }}>Haz click en el número (x2, x3) de una lámina repetida para venderla por 10 monedas al Mercado de Pases.</p>
      </div>
    </div>
  );
}
