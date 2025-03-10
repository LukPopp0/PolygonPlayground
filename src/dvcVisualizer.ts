import { Delaunay, Voronoi } from 'd3-delaunay';
import { BarycentricDualMesh } from './barycentricDualMesh';

export class DVCVisualizer {
  #ctx: CanvasRenderingContext2D;
  #width: number;
  #height: number;
  #delaunay: Delaunay<number>;
  #voronoi!: Voronoi<number>;
  #voronoiPolygons!: number[][][];
  #centroidVoronoi!: BarycentricDualMesh;
  #centroidCells!: number[][][];
  backgroundColor = '#eeeeee';
  #options: { showDelaunay: boolean; showVoronoi: boolean; showCentroids: boolean } = {
    showDelaunay: true,
    showVoronoi: true,
    showCentroids: true,
  };

  constructor(
    ctx: CanvasRenderingContext2D,
    delaunay: Delaunay<number>,
    options?: { showDelaunay: boolean; showVoronoi: boolean; showCentroids: boolean }
  ) {
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
  }

  update(options?: { showDelaunay: boolean; showVoronoi: boolean; showCentroids: boolean }) {
    this.#options = { ...this.#options, ...options };
    this.#init();
  }

  render() {
    this.#ctx.fillStyle = '#eeeeee';
    this.#ctx.fillRect(0, 0, this.#width, this.#height);

    // Delaunay
    if (this.#options.showDelaunay) {
      this.#renderDelaunayLines(this.#delaunay, 2, '#999999');
      this.#renderPoints(this.#delaunay.points, 5, '#ff7777');
    }

    // Voronoi
    if (this.#options.showVoronoi) {
      for (const polygon of this.#voronoiPolygons) {
        this.#renderLines(polygon.flat(), 3, '#8888ff');
      }
      this.#renderPoints(this.#voronoi.circumcenters, 4, '#5555ff');
    }

    // Centroids
    if (this.#options.showCentroids) {
      for (const cell of this.#centroidCells) {
        this.#renderLines(cell.flat(), 3, '#88ff88');
      }
      this.#renderPoints(this.#centroidVoronoi.centroids, 4, '#55ff55');
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
