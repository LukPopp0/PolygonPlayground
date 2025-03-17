import { ChangeEventHandler, useEffect, useRef, useState } from 'react';
import { Delaunay } from 'd3-delaunay';
import MersenneTwister from 'mersenne-twister';
import { DelaunayDualVisualizer } from './delaunayDualVisualizer';
import { useAtom } from 'jotai';
import { displayOptions, displaySize, nPoints } from './state';
import { DualType } from './types/displayOptions';

const BoolSetting = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: ChangeEventHandler<HTMLInputElement>;
}) => (
  <div>
    <label htmlFor={`checkbox-${label}`}>{label}: </label>
    <input type="checkbox" id={`checkbox-${label}`} checked={value} onChange={onChange} />
  </div>
);

const SelectSetting = ({
  label,
  selectedValue,
  options,
  onChange,
}: {
  label: string;
  selectedValue: string;
  options: { label: string; value: string }[];
  onChange: ChangeEventHandler<HTMLSelectElement>;
}) => {
  return (
    <div>
      <label htmlFor={`select-${label.replace(' ', '')}`}>{label}: </label>
      <select value={selectedValue} id={`select-${label.replace(' ', '')}`} onChange={onChange}>
        {options.map(({ label: l, value: v }) => (
          <option key={`${l}:${v}`} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
};

const App = () => {
  const [{ width, height }] = useAtom(displaySize);
  const [displaySettings, setDisplaySettings] = useAtom(displayOptions);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visualizer, setVisualizer] = useState<DelaunayDualVisualizer | null>(null);
  const [numPoints, setNumPoints] = useAtom(nPoints);

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
      <div>
        <div>
          <label>Num. Points: </label>
          <input type="number" value={numPoints} onChange={e => setNumPoints(Number(e.target.value))} />
        </div>
        <BoolSetting
          label="Show Delaunay"
          value={displaySettings.showDelaunay}
          onChange={() => setDisplaySettings(v => ({ ...v, showDelaunay: !v.showDelaunay }))}
        />
        <SelectSetting
          label="Selected Dual Mesh"
          selectedValue={displaySettings.selectedDualMesh}
          options={[
            { value: 'voronoi', label: 'Voronoi' },
            { value: 'centroid', label: 'Centroid' },
            { value: 'incenter', label: 'Incenter' },
            { value: 'interpolated', label: 'Interpolated' },
          ]}
          onChange={e => setDisplaySettings(v => ({ ...v, selectedDualMesh: e.target.value as DualType }))}
        />
        {displaySettings.selectedDualMesh === 'voronoi' && (
          <div>
            <label htmlFor="range-relaxation-steps">Relaxation: </label>
            <input
              type="range"
              min={0}
              max={5}
              step={1}
              value={displaySettings.relaxationSteps}
              id="range-relaxation-steps"
              onChange={e => setDisplaySettings(v => ({ ...v, relaxationSteps: Number(e.target.value) }))}
            />
          </div>
        )}
        {displaySettings.selectedDualMesh === 'interpolated' && (
          <>
            <SelectSetting
              label="Interpolation Start"
              selectedValue={displaySettings.interpolationStart}
              options={[
                { value: 'voronoi', label: 'Voronoi' },
                { value: 'centroid', label: 'Centroid' },
                { value: 'incenter', label: 'Incenter' },
              ]}
              onChange={e => setDisplaySettings(v => ({ ...v, interpolationStart: e.target.value as DualType }))}
            />
            <SelectSetting
              label="Interpolation End"
              selectedValue={displaySettings.interpolationEnd}
              options={[
                { value: 'voronoi', label: 'Voronoi' },
                { value: 'centroid', label: 'Centroid' },
                { value: 'incenter', label: 'Incenter' },
              ]}
              onChange={e => setDisplaySettings(v => ({ ...v, interpolationEnd: e.target.value as DualType }))}
            />
            <div>
              <label htmlFor="range-interpolation">Interpolation: </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={displaySettings.interpolation}
                id="range-interpolation"
                onChange={e => setDisplaySettings(v => ({ ...v, interpolation: Number(e.target.value) }))}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
