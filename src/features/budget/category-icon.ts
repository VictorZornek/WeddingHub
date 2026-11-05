import type { SFSymbol } from 'expo-symbols';

// Picks an SF Symbol from the category name (accents and case ignored).
const ICONS: [keyword: string, icon: SFSymbol][] = [
  ['recepcao', 'fork.knife'],
  ['vestimenta', 'tshirt'],
  ['flores', 'leaf'],
  ['musica', 'music.note'],
  ['foto', 'camera'],
  ['lembranca', 'gift'],
  ['presente', 'gift'],
  ['cerimonia', 'building.columns'],
  ['papelaria', 'envelope'],
  ['alianca', 'circle.circle'],
  ['transporte', 'car'],
  ['apartamento', 'house'],
  ['viagem', 'airplane'],
];

function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export function categoryIcon(name: string): SFSymbol {
  const key = normalize(name);
  return ICONS.find(([keyword]) => key.includes(keyword))?.[1] ?? 'square.grid.2x2';
}
