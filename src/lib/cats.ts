import type { CatDefinition, CatId } from '../types';

export const catDefinitions: Record<CatId, CatDefinition> = {
  pangur: {
    id: 'pangur',
    name: 'Pangur',
    role: 'Strongpaw',
    baseCatch: 3,
    baseMeow: 1,
    portraitSrc: '/assets/cat_detail/Pangur_detail.png',
  },
  guardian: {
    id: 'guardian',
    name: 'Breoinne',
    role: 'Guardian',
    baseCatch: 1,
    baseMeow: 3,
    portraitSrc: '/assets/cat_detail/Breonne_detail.png',
  },
  baircne: {
    id: 'baircne',
    name: 'Baircne',
    role: 'Domestic Cat',
    baseCatch: 2,
    baseMeow: 2,
    portraitSrc: '/assets/cat_detail/Baircne_detail.png',
  },
};

export const CAT_STARTING_HEARTS = 5;
