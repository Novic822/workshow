import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

// points: Array<[lat, lon, intensity]>
export default function HeatmapLayer({ points, options }: { points: Array<[number, number, number]>; options?: any }) {
  const map = useMap();

  useEffect(() => {
    let heat: any = null;
    let mounted = true;

    // Dynamically import leaflet.heat so builds don't fail when it's not installed.
    (async () => {
      try {
        await import('leaflet.heat');
        if (!mounted) return;
        if (!points || points.length === 0) {
          return;
        }

        // leaflet.heat exposes heatLayer on L
        heat = (L as any).heatLayer(points, {
            radius: 30,      // smaller radius
            blur: 0,         // less blur => crisper hotspot
            maxZoom: 16,
            gradient: {0.2: 'blue', 0.5: 'lime', 1.0: 'red'},
            ...(options || {}),
            }).addTo(map as any);
      } catch (err) {
        // If the package isn't installed, log a helpful message.
        // The app will continue to work without heatmap.
        // eslint-disable-next-line no-console
        console.warn('Could not load leaflet.heat. Install with `npm i leaflet.heat` to enable heatmap.');
      }
    })();

    return () => {
      mounted = false;
      if (heat) {
        heat.remove();
      }
    };
  }, [map, points, options]);

  return null;
}
