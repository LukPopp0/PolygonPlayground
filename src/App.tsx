import { useEffect, useRef, useState } from 'react';
import { Delaunay } from 'd3-delaunay';
import MersenneTwister from 'mersenne-twister';
import { DelaunayDualVisualizer } from './delaunayDualVisualizer';
import { useAtom } from 'jotai';
import { displayOptions, displaySize, nPoints } from './state';
import { SettingsPane } from './settings';

const App = () => {
  const [{ width, height }] = useAtom(displaySize);
  const [numPoints] = useAtom(nPoints);
  const [displaySettings] = useAtom(displayOptions);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visualizer, setVisualizer] = useState<DelaunayDualVisualizer | null>(null);

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
    setVisualizer(new DelaunayDualVisualizer(ctx, delaunay));
  }, [height, numPoints, width]);

  useEffect(() => {
    if (!visualizer) return;
    visualizer.update(displaySettings);
    visualizer.render();
  }, [visualizer, displaySettings]);

  return (
    <div
      style={{
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        paddingTop: '5rem',
        paddingBottom: '5rem',
        alignItems: 'center',
        height: 'calc(100% - 10rem)',
      }}
    >
      <canvas ref={canvasRef} width={width} height={height} id="canvas" style={{ border: '1px solid white' }} />
      <SettingsPane />
    </div>
  );
};

export default App;
