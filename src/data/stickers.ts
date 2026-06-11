import type { StickerData } from '../components/StickerCard';

export const STICKER_DB: StickerData[] = [
  // Superestrellas con imágenes reales
  { id: 1, name: 'L. MESSI', country: 'ARG', type: 'star', url: '/assets/stickers/messi.png', stats: '24-06-1987 | 1,70 m', club: 'INTER MIAMI', flagUrl: '/assets/stickers/flag_arg.png' },
  { id: 2, name: 'K. MBAPPÉ', country: 'FRA', type: 'star', url: '/assets/stickers/mbappe.png', stats: '20-12-1998 | 1,78 m', club: 'REAL MADRID', flagUrl: '/assets/stickers/flag_fra.png' },
  { id: 3, name: 'VINI JR', country: 'BRA', type: 'star', url: '/assets/stickers/vini.png', stats: '12-07-2000 | 1,76 m', club: 'REAL MADRID', flagUrl: '/assets/stickers/flag_bra.png' },
  { id: 4, name: 'E. HAALAND', country: 'NOR', type: 'star', url: '/assets/stickers/haaland.png', stats: '21-07-2000 | 1,95 m', club: 'MANCHESTER CITY' },
  { id: 5, name: 'J. BELLINGHAM', country: 'ENG', type: 'star', url: '/assets/stickers/bellingham.png', stats: '29-06-2003 | 1,86 m', club: 'REAL MADRID', flagUrl: '/assets/stickers/flag_eng.png' },
  { id: 6, name: 'H. KANE', country: 'ENG', type: 'star', url: '/assets/stickers/kane.png', stats: '28-07-1993 | 1,88 m', club: 'BAYERN MUNICH', flagUrl: '/assets/stickers/flag_eng.png' },
  { id: 7, name: 'K. DE BRUYNE', country: 'BEL', type: 'star', url: '/assets/stickers/debruyne.png', stats: '28-06-1991 | 1,81 m', club: 'MANCHESTER CITY' },
  { id: 8, name: 'A. DAVIES', country: 'CAN', type: 'star', url: '/assets/stickers/davies.png', stats: '02-11-2000 | 1,85 m', club: 'BAYERN MUNICH' },
  { id: 9, name: 'C. PULISIC', country: 'USA', type: 'star', url: '/assets/stickers/pulisic.png', stats: '18-09-1998 | 1,77 m', club: 'AC MILAN' },
  { id: 10, name: 'G. OCHOA', country: 'MEX', type: 'star', url: '/assets/stickers/ochoa.png', stats: '13-07-1985 | 1,83 m', club: 'SALERNITANA' },

  // Escudos Especiales
  { id: 11, name: 'ESCUDO ARG', country: 'ARG', type: 'shield', url: '/assets/stickers/flag_arg.png' },
  { id: 12, name: 'ESCUDO FRA', country: 'FRA', type: 'shield', url: '/assets/stickers/flag_fra.png' },
  { id: 13, name: 'ESCUDO BRA', country: 'BRA', type: 'shield', url: '/assets/stickers/flag_bra.png' },
  { id: 14, name: 'ESCUDO ENG', country: 'ENG', type: 'shield', url: '/assets/stickers/flag_eng.png' },
  
  // Trofeos y Oficiales
  { id: 15, name: 'COPA DEL MUNDO', country: 'FIFA', type: 'special', url: '/assets/stickers/trophy.png', stats: 'TROFEO OFICIAL 2026' },
  { id: 16, name: 'PELOTA OFICIAL', country: 'FIFA', type: 'special', url: 'https://ui-avatars.com/api/?name=FIFA+26&background=FFD700&color=000&size=200' },
];

// Generar 34 jugadores base adicionales para llegar a 50 láminas
const countries = ['ARG', 'FRA', 'BRA', 'ENG', 'ESP', 'GER', 'POR', 'ITA', 'NED', 'URU'];
const firstNames = ['A.', 'M.', 'J.', 'C.', 'D.', 'L.', 'G.', 'R.', 'P.', 'E.'];
const lastNames = ['Silva', 'García', 'Martínez', 'Smith', 'Müller', 'Rossi', 'Lopes', 'Gómez', 'Costa', 'Hernández'];

for (let i = 17; i <= 50; i++) {
  const country = countries[i % countries.length];
  const name = `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`;
  STICKER_DB.push({
    id: i,
    name: name.toUpperCase(),
    country: country,
    type: 'base',
    url: `https://ui-avatars.com/api/?name=${name.replace(' ', '+')}&background=random&size=200`,
    stats: 'INFO NO DISPONIBLE',
    club: 'LIGA LOCAL'
  });
}
