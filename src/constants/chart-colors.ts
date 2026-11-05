// Soft colors that sit well next to the aqua-green palette.
const CATEGORY_COLORS = [
  '#76B7AC', // aqua
  '#E7B98F', // sand
  '#B4A7D6', // lavender
  '#E7A9A3', // blush
  '#A8C69F', // sage
  '#8FB8D6', // sky
  '#D9C27A', // mustard
  '#C79FB8', // mauve
  '#D8A48F', // clay
  '#A3B18A', // olive
];
export const OTHERS_COLOR = '#B9C4C2';

// Color of a category from its position in the project, so the same category keeps
// the same color in every chart. "others" and unknown ids get the neutral gray.
export function categoryColor(categoryIds: string[], id: string) {
  const index = categoryIds.indexOf(id);
  return index < 0 ? OTHERS_COLOR : CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}
