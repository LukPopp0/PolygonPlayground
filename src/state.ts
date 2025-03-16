import { atom } from 'jotai';
import type { DisplayOptions } from './types/displayOptions';

export const displayOptions = atom<DisplayOptions>({
  showDelaunay: true,
  showVoronoi: false,
  showCentroids: false,
  showIncenter: false,
  showInterpolation: true,
  interpolationStart: 'voronoi',
  interpolationEnd: 'centroid',
  interpolation: 0.5,
});

export const displaySize = atom({
  width: 720,
  height: 720,
});

export const nPoints = atom(40);
