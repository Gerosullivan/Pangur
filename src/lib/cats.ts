import type { CatDefinition, CatId } from '../types';

export const catDefinitions: Record<CatId, CatDefinition> = {
  pangur: {
    id: 'pangur',
    name: 'Pangur',
    role: 'Strongpaw',
    baseCatch: 3,
    baseMeow: 1,
    portrait: '🐱',
  },
  guardian: {
    id: 'guardian',
    name: 'Breoinne',
    role: 'Guardian',
    baseCatch: 1,
    baseMeow: 3,
    portrait: '🐈',
  },
  baircne: {
    id: 'baircne',
    name: 'Baircne',
    role: 'Domestic Cat',
    baseCatch: 2,
    baseMeow: 2,
    portrait: '🐈‍⬛',
  },
};

export const CAT_STARTING_HEARTS = 5;
