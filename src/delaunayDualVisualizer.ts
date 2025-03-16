import { Delaunay, Voronoi } from 'd3-delaunay';
import { BarycentricDualMesh, DelaunayDualMesh, IncentricDualMesh } from './delaunayDualMesh';
import type { DisplayOptions } from './types/displayOptions';

const lineThickness = 2;
const delaunayPointSize = 6;
const dualMeshPointSize = 4;

export class DelaunayDualVisualizer {
  #ctx: CanvasRenderingContext2D;
  #width: number;
  #height: number;
  #delaunay: Delaunay<number>;
  #voronoi!: Voronoi<number>;
  #voronoiPolygons!: number[][][];
  #centroidVoronoi!: BarycentricDualMesh;
  #centroidCells!: number[][][];
  #incentricVoronoi!: IncentricDualMesh;
  #incentricCells!: number[][][];
  backgroundColor = '#555555';
  #options: Partial<DisplayOptions> = {
    showDelaunay: true,
    showVoronoi: true,
    showCentroids: false,
    showIncenter: false,
    showInterpolation: false,
  };

  constructor(ctx: CanvasRenderingContext2D, delaunay: Delaunay<number>, options?: Partial<DisplayOptions>) {
    this.#ctx = ctx;
    this.#delaunay = delaunay;
    this.#width = ctx.canvas.width;
    this.#height = ctx.canvas.height;
    this.update(options);
  }

  #init() {
    this.#width = this.#ctx.canvas.width;
    this.#height = this.#ctx.canvas.height;

    this.#voronoi = this.#delaunay.voronoi([0, 0, this.#width, this.#height]);
    this.#voronoiPolygons = new Array<number[][]>();
    for (const cellPolygon of this.#voronoi.cellPolygons()) {
      this.#voronoiPolygons.push(cellPolygon);
    }

    this.#centroidVoronoi = new BarycentricDualMesh(this.#delaunay, [0, 0, this.#width, this.#height]);
    this.#centroidCells = new Array<number[][]>();
    for (const centroidPolygon of this.#centroidVoronoi.cellPolygons()) {
      this.#centroidCells.push(centroidPolygon);
    }

    this.#incentricVoronoi = new IncentricDualMesh(this.#delaunay, [0, 0, this.#width, this.#height]);
    this.#incentricCells = new Array<number[][]>();
    for (const incentricPolygon of this.#incentricVoronoi.cellPolygons()) {
      this.#incentricCells.push(incentricPolygon);
    }
  }

  update(options?: Partial<DisplayOptions>) {
    this.#options = { ...this.#options, ...options };
    this.#init();
  }

  render() {
    this.#ctx.fillStyle = this.backgroundColor;
    this.#ctx.fillRect(0, 0, this.#width, this.#height);

    // Delaunay
    if (this.#options.showDelaunay) {
      this.#renderDelaunayLines(this.#delaunay, lineThickness, '#bbbbbb');
      this.#renderPoints(this.#delaunay.points, delaunayPointSize, '#cc4444');
    }

    // Voronoi
    if (this.#options.showVoronoi) {
      for (const polygon of this.#voronoiPolygons) {
        this.#renderLines(polygon.flat(), lineThickness, '#ffcccc');
      }
      this.#renderPoints(this.#voronoi.circumcenters, dualMeshPointSize, '#ff4444');
    }

    // Centroids
    if (this.#options.showCentroids) {
      for (const cell of this.#centroidCells) {
        this.#renderLines(cell.flat(), lineThickness, '#ccffcc');
      }
      this.#renderPoints(this.#centroidVoronoi.dualPoints, dualMeshPointSize, '#44ff44');
    }

    // Incenters
    if (this.#options.showIncenter) {
      for (const cell of this.#incentricCells) {
        this.#renderLines(cell.flat(), lineThickness, '#ffffcc');
      }
      this.#renderPoints(this.#incentricVoronoi.dualPoints, dualMeshPointSize, '#ffff44');
    }

    // Interpolation
    // This is very much optional but it works...
    if ((this.#options.showInterpolation && this.#options.interpolationStart && this.#options.interpolationEnd)) {
      const iStart = this.#options.interpolationStart;
      const iEnd = this.#options.interpolationEnd;
      const pointsA =
        iStart === 'voronoi'
          ? this.#voronoi.circumcenters
          : iStart === 'centroid'
          ? this.#centroidVoronoi.dualPoints
          : this.#incentricVoronoi.dualPoints;
      const pointsB =
        iEnd === 'voronoi'
          ? this.#voronoi.circumcenters
          : iEnd === 'centroid'
          ? this.#centroidVoronoi.dualPoints
          : this.#incentricVoronoi.dualPoints;

      const interpolatedPoints = new Array<number>(pointsA.length);
      const interpolation = this.#options.interpolation ?? 0.5;
      for (let i = 0; i < pointsA.length; i++) {
        interpolatedPoints[i] = pointsA[i] + (pointsB[i] - pointsA[i]) * interpolation;
      }
      const dualMesh = new DelaunayDualMesh(this.#delaunay, [0, 0, this.#width, this.#height], interpolatedPoints);
      const dualCells = new Array<number[][]>();
      for (const interpolated of dualMesh.cellPolygons()) {
        dualCells.push(interpolated);
      }
      // Render
      for (const cell of dualCells) {
        this.#renderLines(cell.flat(), lineThickness, '#ccccff');
      }
      this.#renderPoints(dualMesh.dualPoints, dualMeshPointSize, '#4444ff');
    }
  }

  #renderPoints(points: ArrayLike<number>, radius = 6, fill = '#ff0000') {
    const tau = 2 * Math.PI;
    const ctx = this.#ctx;
    ctx.beginPath();
    for (let i = 0, n = points.length; i < n; i += 2) {
      const x = points[i];
      const y = points[i + 1];
      ctx.moveTo(x + radius, y);
      ctx.arc(x, y, radius, 0, tau);
    }
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.closePath();
  }

  #renderLines(points: ArrayLike<number>, strokeWidth = 2, strokeColor = '#aaaaaa') {
    const ctx = this.#ctx;
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = strokeColor;
    ctx.beginPath();
    for (let i = 0, n = points.length; i < n; i += 2) {
      ctx.lineTo(points[i], points[i + 1]);
      ctx.moveTo(points[i], points[i + 1]);
    }
    ctx.stroke();
    ctx.closePath();
  }

  #renderDelaunayLines(delaunay: Delaunay<number>, strokeWidth = 2, strokeColor = '#aaaaaa') {
    const ctx = this.#ctx;
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = strokeColor;
    for (let ti = 0; ti < delaunay.triangles.length / 3; ++ti) {
      ctx.beginPath();
      delaunay.renderTriangle(ti, ctx);
      ctx.stroke();
    }
  }
}
