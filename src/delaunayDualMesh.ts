import { Delaunay, Voronoi } from 'd3-delaunay';

// Copyright copy from d3 as this is based on their code:
// Copyright 2010-2023 Mike Bostock

// Permission to use, copy, modify, and/or distribute this software for any purpose
// with or without fee is hereby granted, provided that the above copyright notice
// and this permission notice appear in all copies.

// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
// REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
// FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
// INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
// OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
// TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
// THIS SOFTWARE.

export class DelaunayDualMesh extends Voronoi<number> {
  dualPoints: number[];

  constructor(
    delaunay: Delaunay<number>,
    [xmin, ymin, xmax, ymax]: [number, number, number, number],
    dualPoints: Array<number>
  ) {
    // @ts-expect-error: Incorrect types in @types/d3-delaunay
    super(delaunay, [xmin, ymin, xmax, ymax]);
    this.dualPoints = dualPoints;
  }

  // Copy of the _init function with the circumcenter calculation removed
  _init() {
    const {
      delaunay: { points, hull },
      vectors,
    } = this;

    // Compute exterior cell rays.
    let h = hull[hull.length - 1];
    let p0,
      p1 = h * 4;
    let x0,
      x1 = points[2 * h];
    let y0,
      y1 = points[2 * h + 1];
    vectors.fill(0);
    for (let i = 0; i < hull.length; ++i) {
      h = hull[i];
      p0 = p1;
      x0 = x1;
      y0 = y1;
      p1 = h * 4;
      x1 = points[2 * h];
      y1 = points[2 * h + 1];
      vectors[p0 + 2] = vectors[p1] = y0 - y1;
      vectors[p0 + 3] = vectors[p1 + 1] = x1 - x0;
    }
  }

  // Copy of the _cell function from d3-delaunay replacing circumcenters with the centroids
  _cell(i: number) {
    const {
      dualPoints,
      delaunay: { inedges, halfedges, triangles },
    } = this;
    const e0 = inedges[i];
    if (e0 === -1) return null; // coincident point
    const points = [];
    let e = e0;
    do {
      const t = Math.floor(e / 3);
      points.push(dualPoints[t * 2], dualPoints[t * 2 + 1]);
      e = e % 3 === 2 ? e - 2 : e + 1;
      if (triangles[e] !== i) break; // bad triangulation
      e = halfedges[e];
    } while (e !== e0 && e !== -1);
    return points;
  }

  updateDualPoints(dualPoints: Array<number>) {
    this.dualPoints = dualPoints;
  }
}

/**
 * This class extends the Voronoi class from d3-delaunay to use centroids instead of circumcenters.
 */
export class BarycentricDualMesh extends DelaunayDualMesh {
  constructor(delaunay: Delaunay<number>, [xmin, ymin, xmax, ymax]: [number, number, number, number]) {
    const centroids = new Array<number>((delaunay.triangles.length / 3) * 2);
    for (let i = 0; i < delaunay.triangles.length / 3; i++) {
      const [[x0, y0], [x1, y1], [x2, y2]] = delaunay.trianglePolygon(i);
      centroids[2 * i] = (x0 + x1 + x2) / 3;
      centroids[2 * i + 1] = (y0 + y1 + y2) / 3;
    }

    super(delaunay, [xmin, ymin, xmax, ymax], centroids);
  }
}

/**
 * This class extends the Voronoi class from d3-delaunay to use centroids instead of circumcenters.
 */
export class IncentricDualMesh extends DelaunayDualMesh {
  constructor(delaunay: Delaunay<number>, [xmin, ymin, xmax, ymax]: [number, number, number, number]) {
    const incenters = new Array<number>((delaunay.triangles.length / 3) * 2);
    for (let i = 0; i < delaunay.triangles.length / 3; i++) {
      const [[x0, y0], [x1, y1], [x2, y2]] = delaunay.trianglePolygon(i);
      // Incenter formula:
      // (x, y) = {(ax0 + bx1 + cx2)/(a + b + c), (ay0 + by1 + cy2)/(a + b + c)}
      const a = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
      const b = Math.sqrt((x0 - x2) ** 2 + (y0 - y2) ** 2);
      const c = Math.sqrt((x0 - x1) ** 2 + (y0 - y1) ** 2);

      incenters[2 * i] = (a * x0 + b * x1 + c * x2) / (a + b + c);
      incenters[2 * i + 1] = (a * y0 + b * y1 + c * y2) / (a + b + c);
    }

    super(delaunay, [xmin, ymin, xmax, ymax], incenters);
  }
}
