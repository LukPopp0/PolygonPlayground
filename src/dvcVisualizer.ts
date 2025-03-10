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

  constructor(ctx: CanvasRenderingContext2D, delaunay: Delaunay<number>) {
    this.#ctx = ctx;
    this.#delaunay = delaunay;
    this.#width = ctx.canvas.width;
    this.#height = ctx.canvas.height;
    this.update();
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

  update() {
    this.#init();
    this.render();
  }

  render() {
    this.#ctx.fillStyle = '#eeeeee';
    this.#ctx.fillRect(0, 0, this.#width, this.#height);

    // Delaunay
    this.#renderDelaunayLines(this.#delaunay, 2, '#999999');
    this.#renderPoints(this.#delaunay.points, 5, '#ff7777');

    // Voronoi
    for (const polygon of this.#voronoiPolygons) {
      this.#renderLines(polygon.flat(), 2, '#8888ff');
    }
    this.#renderPoints(this.#voronoi.circumcenters, 5, '#5555ff');

    // Centroids
    for (const cell of this.#centroidCells) {
      this.#renderLines(cell.flat(), 2, '#88ff88');
    }
    this.#renderPoints(this.#centroidVoronoi.centroids, 5, '#55ff55');
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
