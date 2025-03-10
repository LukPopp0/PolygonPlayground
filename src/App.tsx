import { useEffect, useRef, useState } from 'react';
import { Delaunay } from 'd3-delaunay';
import MersenneTwister from 'mersenne-twister';
import { DVCVisualizer } from './dvcVisualizer';

const width = 720,
  height = 720,
  numPoints = 20,
  seed = 0;

const App = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visualizer, setVisualizer] = useState<DVCVisualizer | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const random = new MersenneTwister(seed);
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
  }, []);

  useEffect(() => {
    if (!visualizer) return;
    // visualizer.render();
  }, [visualizer]);

  return (
    <div style={{ width: '100dvw', height: '100dvh', alignContent: 'center', textAlign: 'center' }}>
      <canvas ref={canvasRef} width={width} height={height} id="canvas" style={{ border: '1px solid white' }} />
    </div>
  );
};

export default App;
