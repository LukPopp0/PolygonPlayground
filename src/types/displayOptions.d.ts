export type DualType = 'voronoi' | 'centroid' | 'incenter';

export type DisplayOptions = {
  showDelaunay: boolean;
  selectedDualMesh: DualType | 'interpolated';
  relaxationSteps: number;
  interpolationStart: DualType;
  interpolationEnd: DualType;
  interpolation: number;
};
