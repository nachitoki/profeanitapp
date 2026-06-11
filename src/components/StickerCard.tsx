

export type StickerData = {
  id: number;
  name: string;
  country: string;
  type: 'star' | 'shield' | 'special' | 'base';
  url: string;
  stats?: string;
  club?: string;
  flagUrl?: string;
};

interface StickerCardProps {
  sticker: StickerData;
  isOwned: boolean;
  count?: number;
  onClick?: () => void;
  onSellDuplicate?: (id: number) => void;
  size?: 'small' | 'large';
}

export function StickerCard({ sticker, isOwned, count = 0, onClick, onSellDuplicate, size = 'small' }: StickerCardProps) {
  const isLarge = size === 'large';
  const width = isLarge ? 350 : '100%';
  const height = isLarge ? 490 : '100%';

  // Determine colors based on country or type
  let bgPrimary = '#7FE5E4';
  let bannerColor = '#007A7A';
  let numberColor1 = '#006600';
  let numberColor2 = '#CC0000';

  if (sticker.country === 'ARG') { bgPrimary = '#75AADB'; bannerColor = '#43719F'; numberColor1 = '#FFFFFF'; numberColor2 = '#43719F'; }
  if (sticker.country === 'BRA') { bgPrimary = '#FFDF00'; bannerColor = '#009C3B'; numberColor1 = '#009C3B'; numberColor2 = '#002776'; }
  if (sticker.country === 'FRA') { bgPrimary = '#0055A4'; bannerColor = '#EF4135'; numberColor1 = '#FFFFFF'; numberColor2 = '#0055A4'; }
  if (sticker.type === 'special') { bgPrimary = '#FFD700'; bannerColor = '#B8860B'; numberColor1 = '#FFFFFF'; numberColor2 = '#000000'; }

  return (
    <div 
      onClick={onClick}
      style={{ 
        position: 'relative', 
        width: isLarge ? width : '100%', 
        height: isLarge ? height : '100%',
        aspectRatio: isLarge ? 'auto' : '2.5/3.5',
        backgroundColor: bgPrimary,
        borderRadius: isLarge ? '12px' : '8px',
        boxShadow: isLarge ? '0 10px 30px rgba(0,0,0,0.5)' : 'none',
        overflow: 'hidden',
        border: isOwned ? (sticker.type === 'special' ? '3px solid #FBBF24' : '3px solid white') : '3px dashed #64748B',
        cursor: isOwned ? 'pointer' : 'default',
        opacity: isOwned ? 1 : 0.4,
        filter: isOwned ? 'none' : 'grayscale(100%)',
        transform: isLarge ? 'scale(1)' : 'scale(1)',
      }}
      className={isOwned ? "sticker-card-interactive" : ""}
    >
      <style>{`
        .sticker-card-interactive::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            to bottom right,
            rgba(255,255,255,0) 0%,
            rgba(255,255,255,0.1) 40%,
            rgba(255,255,255,0.5) 50%,
            rgba(255,255,255,0.1) 60%,
            rgba(255,255,255,0) 100%
          );
          transform: rotate(30deg) translateY(-100%);
          transition: transform 0.6s ease;
          pointer-events: none;
          z-index: 10;
        }
        .sticker-card-interactive:hover::after {
          transform: rotate(30deg) translateY(100%);
        }
      `}</style>

      {isOwned ? (
        <>
          {/* Numbers Background */}
          {isLarge && (
            <>
              <div style={{ position: 'absolute', top: 50, left: -20, fontFamily: 'Anton', fontSize: 250, color: numberColor1, lineHeight: 1, zIndex: 1, opacity: 0.5 }}>2</div>
              <div style={{ position: 'absolute', top: 150, right: -20, fontFamily: 'Anton', fontSize: 250, color: numberColor2, lineHeight: 1, zIndex: 1, opacity: 0.5 }}>6</div>
              <img src="/assets/stickers/trophy.png" alt="WC" style={{ position: 'absolute', top: 15, right: 15, width: 60, zIndex: 3, opacity: 0.9 }} />
            </>
          )}

          {/* Image */}
          <img 
            src={sticker.url} 
            alt={sticker.name} 
            style={{ 
              position: 'absolute',
              bottom: isLarge ? 70 : 20,
              left: '50%',
              transform: 'translateX(-50%)',
              width: isLarge ? 420 : '140%',
              height: isLarge ? 'auto' : '85%',
              objectFit: isLarge ? 'contain' : 'cover',
              zIndex: 2,
              maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)'
            }} 
          />

          {/* Vertical Elements */}
          {isLarge && sticker.type !== 'special' && sticker.type !== 'shield' && (
            <div style={{ position: 'absolute', bottom: 120, right: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3 }}>
              {sticker.flagUrl && <img src={sticker.flagUrl} alt="Flag" style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid white', objectFit: 'cover', marginBottom: 5 }} />}
              <div style={{ writingMode: 'vertical-rl', textOrientation: 'upright', fontFamily: 'Anton', fontSize: 32, color: 'transparent', WebkitTextStroke: '1px white', letterSpacing: -5, textTransform: 'uppercase' }}>
                {sticker.country}
              </div>
            </div>
          )}

          {/* Bottom Banner */}
          <div style={{ 
            position: 'absolute', bottom: 0, left: 0, width: '100%', 
            height: isLarge ? 90 : 35, 
            backgroundColor: bannerColor, zIndex: 4, 
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
            paddingTop: isLarge ? 5 : 2, borderTop: '2px solid white'
          }}>
            <h1 style={{ color: 'white', fontFamily: 'Anton', fontSize: isLarge ? 26 : 12, margin: 0, letterSpacing: 1, textTransform: 'uppercase' }}>
              {sticker.name}
            </h1>
            {isLarge && (
              <>
                <p style={{ color: 'white', fontSize: 12, fontWeight: 700, margin: '2px 0 5px 0' }}>{sticker.stats || 'INFO NO DISPONIBLE'}</p>
                <div style={{ width: '100%', backgroundColor: bgPrimary, color: bannerColor, fontWeight: 900, fontSize: 12, textAlign: 'center', padding: '3px 0', textTransform: 'uppercase' }}>
                  {sticker.club || 'NACIONAL'}
                </div>
              </>
            )}
          </div>

          {/* Duplicate Badge */}
          {count > 1 && onSellDuplicate && !isLarge && (
            <div 
              onClick={(e) => { e.stopPropagation(); onSellDuplicate(sticker.id); }} 
              style={{ position: 'absolute', top: 5, right: 5, backgroundColor: '#EF4444', color: 'white', borderRadius: '50%', width: 24, height: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.8rem', fontWeight: 'bold', zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.5)', cursor: 'pointer' }}
            >
              x{count}
            </div>
          )}
        </>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94A3B8', fontSize: '2rem', fontWeight: 'bold' }}>
          {sticker.id}
        </div>
      )}
    </div>
  );
}
