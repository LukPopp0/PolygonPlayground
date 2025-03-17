import { Delaunay } from 'd3-delaunay';
import { DelaunayDualMesh } from './delaunayDualMesh';
import type { DisplayOptions } from './types/displayOptions';

const lineThickness = 2;
const delaunayPointSize = 6;
const dualMeshPointSize = 4;

function calculateBarycenters(delaunay: Delaunay<number>) {
  const centroids = new Array<number>((delaunay.triangles.length / 3) * 2);
  for (let i = 0; i < delaunay.triangles.length / 3; i++) {
    const [[x0, y0], [x1, y1], [x2, y2]] = delaunay.trianglePolygon(i);
    centroids[2 * i] = (x0 + x1 + x2) / 3;
    centroids[2 * i + 1] = (y0 + y1 + y2) / 3;
  }
  return centroids;
}

function calculateIncenters(delaunay: Delaunay<number>) {
  const incenters = new Array<number>((delaunay.triangles.length / 3) * 2);
  for (let i = 0; i < delaunay.triangles.length / 3; i++) {
    const [[x0, y0], [x1, y1], [x2, y2]] = delaunay.trianglePolygon(i);
    const a = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
    const b = Math.sqrt((x0 - x2) ** 2 + (y0 - y2) ** 2);
    const c = Math.sqrt((x0 - x1) ** 2 + (y0 - y1) ** 2);

    incenters[2 * i] = (a * x0 + b * x1 + c * x2) / (a + b + c);
    incenters[2 * i + 1] = (a * y0 + b * y1 + c * y2) / (a + b + c);
  }
  return incenters;
}

function calculateCicumcenters(delaunay: Delaunay<number>) {
  const circumcenters = new Array<number>((delaunay.triangles.length / 3) * 2);
  for (let i = 0; i < delaunay.triangles.length / 3; i++) {
    const [[x0, y0], [x1, y1], [x2, y2]] = delaunay.trianglePolygon(i);
    const a = x1 - x0;
    const b = y1 - y0;
    const c = x2 - x0;
    const d = y2 - y0;
    const e = a * (x0 + x1) + b * (y0 + y1);
    const f = c * (x0 + x2) + d * (y0 + y2);
    const g = 2 * (a * (y2 - y1) - b * (x2 - x1));
    circumcenters[2 * i] = (d * e - b * f) / g;
    circumcenters[2 * i + 1] = (a * f - c * e) / g;
  }
  return circumcenters;
}

export class DelaunayDualVisualizer {
  #ctx: CanvasRenderingContext2D;
  #width: number;
  #height: number;
  #delaunay: Delaunay<number>;
  #voronoi!: DelaunayDualMesh;
  #centroidVoronoi!: DelaunayDualMesh;
  #incentricVoronoi!: DelaunayDualMesh;
  backgroundColor = '#555555';
  #options: Partial<DisplayOptions> = {
    showDelaunay: true,
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

    const circumcenters = calculateCicumcenters(this.#delaunay);
    this.#voronoi = new DelaunayDualMesh(this.#delaunay, [0, 0, this.#width, this.#height], circumcenters);
    const barycenters = calculateBarycenters(this.#delaunay);
    this.#centroidVoronoi = new DelaunayDualMesh(this.#delaunay, [0, 0, this.#width, this.#height], barycenters);
    const incenters = calculateIncenters(this.#delaunay);
    this.#incentricVoronoi = new DelaunayDualMesh(this.#delaunay, [0, 0, this.#width, this.#height], incenters);
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
    if (this.#options.selectedDualMesh === 'voronoi') {
      this.#renderDualMesh(this.#voronoi, '#ccccff', '#4444ff');
    }

    // Centroids
    if (this.#options.selectedDualMesh === 'centroid') {
      this.#renderDualMesh(this.#centroidVoronoi, '#ccffcc', '#44ff44');
    }

    // Incenters
    if (this.#options.selectedDualMesh === 'incenter') {
      this.#renderDualMesh(this.#incentricVoronoi, '#ffffcc', '#ffff44');
    }

    // Interpolation
    // This is very much optional but it works...
    if (
      this.#options.selectedDualMesh === 'interpolated' &&
      this.#options.interpolationStart &&
      this.#options.interpolationEnd
    ) {
      const iStart = this.#options.interpolationStart;
      const iEnd = this.#options.interpolationEnd;
      const pointsA = (
        iStart === 'voronoi' ? this.#voronoi : iStart === 'centroid' ? this.#centroidVoronoi : this.#incentricVoronoi
      ).dualPoints;
      const pointsB = (
        iEnd === 'voronoi' ? this.#voronoi : iEnd === 'centroid' ? this.#centroidVoronoi : this.#incentricVoronoi
      ).dualPoints;

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
      this.#renderDualMesh(dualMesh, '#ccccff', '#4444ff');
    }
  }

  #getCells(mesh: DelaunayDualMesh) {
    const cells = new Array<number[][]>();
    for (const cellPolygon of mesh.cellPolygons()) {
      cells.push(cellPolygon);
    }
    return cells;
  }

  #renderDualMesh(mesh: DelaunayDualMesh, lineColor: string, pointColor: string) {
    for (const cell of this.#getCells(mesh)) {
      this.#renderLines(cell.flat(), lineThickness, lineColor);
    }
    this.#renderPoints(mesh.dualPoints, dualMeshPointSize, pointColor);
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
