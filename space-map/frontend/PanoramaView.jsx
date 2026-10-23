import { useEffect, useRef } from 'react';
import { Viewer } from '@photo-sphere-viewer/core';
import '@photo-sphere-viewer/core/index.css';
import { api } from './api';

export default function PanoramaView({ panoId, onClose, onNavigate }) {
  const ref = useRef(null);
  const viewerRef = useRef(null);

  useEffect(() => {
    let viewer;
    api.get(`/panorama/${panoId}`).then(pano => {
      viewer = new Viewer({
        container: ref.current,
        panorama: pano.image_url,
        navbar: false,
        markers: (pano.hotspots || []).map(h => ({
          id: String(h.id),
          longitude: h.yaw,
          latitude: h.pitch,
          html: `<div class="hotspot-marker">→</div>`,
        })),
      });
      viewer.addEventListener('click', ({ markerId }) => {
        if (markerId) {
          const hs = (pano.hotspots || []).find(h => String(h.id) === markerId);
          if (hs) onNavigate(hs.target_panorama_id);
        }
      });
      viewerRef.current = viewer;
    });
    return () => viewer && viewer.destroy();
  }, [panoId]);

  return (
    <div className="pano-container">
      <div ref={ref} style={{ width: '100%', height: '100%' }} />
      <button className="close-pano" onClick={onClose}>✕ Карта</button>
    </div>
  );
}