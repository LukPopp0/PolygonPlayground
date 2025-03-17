/* eslint-disable react-hooks/exhaustive-deps */
import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { displayOptions, nPoints } from './state';
import { DualType } from './types/displayOptions';
import { BladeApi, Pane } from 'tweakpane';

const pane = new Pane({ title: 'Display Settings', expanded: true });
const temporaryBindings: Record<string, BladeApi> = {};
export const SettingsPane = () => {
  const [numPoints, setNumPoints] = useAtom(nPoints);
  const [displaySettings, setDisplaySettings] = useAtom(displayOptions);

  // Permanent Bindings
  useEffect(() => {
    pane
      .addBinding({ numPoints }, 'numPoints', { label: 'Number of Points', step: 1, min: 5, max: 100 })
      .on('change', ev => {
        setNumPoints(ev.value);
      });
    pane.addBinding(displaySettings, 'showDelaunay', { label: 'Show Delaunay' }).on('change', ev => {
      setDisplaySettings(v => ({ ...v, showDelaunay: ev.value }));
    });
    pane
      .addBinding(displaySettings, 'selectedDualMesh', {
        label: 'Dual Mesh',
        options: { Voronoi: 'voronoi', Centroid: 'centroid', Incenter: 'incenter', Interpolated: 'interpolated' },
      })
      .on('change', ev => {
        setDisplaySettings(v => ({ ...v, selectedDualMesh: ev.value as DualType }));
      });
  }, []);

  useEffect(() => {
    // TODO: Add and enable relaxation
    // if (displaySettings.selectedDualMesh === 'voronoi') {
    //   temporaryBindings['selectedDualMesh'] = pane
    //     .addBinding(displaySettings, 'relaxationSteps', { label: 'Relaxation Steps', step: 1, min: 0, max: 5 })
    //     .on('change', ev => {
    //       setDisplaySettings(v => ({ ...v, relaxationSteps: ev.value }));
    //     });
    // } else if (temporaryBindings['selectedDualMesh']) {
    //   pane.remove(temporaryBindings['selectedDualMesh']);
    //   delete temporaryBindings['selectedDualMesh'];
    // }
  }, [displaySettings.selectedDualMesh]);

  useEffect(() => {
    if (displaySettings.selectedDualMesh === 'interpolated') {
      temporaryBindings['interpolationStart'] = pane
        .addBinding(displaySettings, 'interpolationStart', {
          label: 'Start Dual',
          options: { Voronoi: 'voronoi', Centroid: 'centroid', Incenter: 'incenter' },
        })
        .on('change', ev => {
          setDisplaySettings(v => ({ ...v, interpolationStart: ev.value as DualType }));
        });
      temporaryBindings['interpolationEnd'] = pane
        .addBinding(displaySettings, 'interpolationEnd', {
          label: 'End Dual',
          options: { Voronoi: 'voronoi', Centroid: 'centroid', Incenter: 'incenter' },
        })
        .on('change', ev => {
          setDisplaySettings(v => ({ ...v, interpolationEnd: ev.value as DualType }));
        });
      temporaryBindings['interpolation'] = pane
        .addBinding(displaySettings, 'interpolation', { label: 'Interpolation', step: 0.01, min: 0, max: 1 })
        .on('change', ev => {
          setDisplaySettings(v => ({ ...v, interpolation: ev.value }));
        });
    } else {
      if (temporaryBindings['interpolationStart']) {
        pane.remove(temporaryBindings['interpolationStart']);
        delete temporaryBindings['interpolationStart'];
      }
      if (temporaryBindings['interpolationEnd']) {
        pane.remove(temporaryBindings['interpolationEnd']);
        delete temporaryBindings['interpolationEnd'];
      }
      if (temporaryBindings['interpolation']) {
        pane.remove(temporaryBindings['interpolation']);
        delete temporaryBindings['interpolation'];
      }
    }
  }, [displaySettings.selectedDualMesh]);

  return <></>;
};
