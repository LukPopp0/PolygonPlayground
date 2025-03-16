export type DualType = 'voronoi' | 'centroid' | 'incenter';

export type DisplayOptions = {
  showDelaunay: boolean;
  showVoronoi: boolean;
  showCentroids: boolean;
  showIncenter: boolean;
  showInterpolation: boolean;
  interpolationStart: DualType;
  interpolationEnd: DualType;
  interpolation: number;
};
