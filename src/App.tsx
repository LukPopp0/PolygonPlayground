import { useEffect, useRef, useState } from 'react';
import { Delaunay } from 'd3-delaunay';
import MersenneTwister from 'mersenne-twister';
import { DVCVisualizer } from './dvcVisualizer';

const width = 720,
  height = 720;

const App = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visualizer, setVisualizer] = useState<DVCVisualizer | null>(null);
  const [numPoints, setNumPoints] = useState(40);
  const [showDelaunay, setShowDelaunay] = useState(true);
  const [showVoronoi, setShowVoronoi] = useState(true);
  const [showCentroids, setShowCentroids] = useState(true);
  // TODO:
  // const [showInterpolation, setShowInterpolation] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const random = new MersenneTwister(numPoints - 5);
    const randomPoints: number[][] = [
      [0, 0],
      [width, 0],
      [0, height],
      [width, height],
      ...Array.from({ length: numPoints - 4 }, () => [
        Math.round(random.random() * width),
        Math.round(random.random() * height),
      ]),
    ];

    const delaunay = new Delaunay<number>(randomPoints.flat());
    setVisualizer(new DVCVisualizer(ctx, delaunay));
  }, [numPoints]);

  useEffect(() => {
    if (!visualizer) return;
    visualizer.update({ showDelaunay, showVoronoi, showCentroids });
    visualizer.render();
  }, [visualizer, showDelaunay, showVoronoi, showCentroids]);

  return (
    <div style={{ width: '100dvw', height: '100dvh', alignContent: 'center', textAlign: 'center' }}>
      <canvas ref={canvasRef} width={width} height={height} id="canvas" style={{ border: '1px solid white' }} />
      <div>
        <div>
          <label>Num. Points: </label>
          <input type="number" value={numPoints} onChange={e => setNumPoints(Number(e.target.value))} />
        </div>
        <div>
          <label>Show Delaunay: </label>
          <input type="checkbox" checked={showDelaunay} onChange={() => setShowDelaunay(v => !v)} />
        </div>
        <div>
          <label>Show Voronoi Dual: </label>
          <input type="checkbox" checked={showVoronoi} onChange={() => setShowVoronoi(v => !v)} />
        </div>
        <div>
          <label>Show Centroidal Dual: </label>
          <input type="checkbox" checked={showCentroids} onChange={() => setShowCentroids(v => !v)} />
        </div>
      </div>
    </div>
  );
};

export default App;
