

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix broken Leaflet icons in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom coloured drop pin
function makePin(color, label) {
  return L.divIcon({
    className: '',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;">
        <div style="
          background:${color};
          color:white;
          font-size:11px;
          font-weight:700;
          padding:3px 7px;
          border-radius:8px;
          white-space:nowrap;
          box-shadow:0 2px 6px rgba(0,0,0,0.3);
          margin-bottom:3px;
        ">${label}</div>
        <div style="
          width:20px;height:20px;
          background:${color};
          border:3px solid white;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          box-shadow:0 2px 6px rgba(0,0,0,0.3);
        "></div>
      </div>
    `,
    iconSize:   [60, 44],
    iconAnchor: [10, 44],
    popupAnchor:[5, -44],
  });
}

export default function MapPage() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const mapRef         = useRef(null);   // the div
  const mapInstance    = useRef(null);   // the L.Map
  const myRole         = localStorage.getItem('role');

  const reservationId     = searchParams.get('reservationId');
  const providerLat       = parseFloat(searchParams.get('providerLat'));
  const providerLng       = parseFloat(searchParams.get('providerLng'));
  const providerAddress   = searchParams.get('providerAddress') || 'Pickup Location';
  const foodName          = searchParams.get('foodName')        || 'Food';
  const myLat             = parseFloat(searchParams.get('myLat'));
  const myLng             = parseFloat(searchParams.get('myLng'));

  const hasProviderCoords = !isNaN(providerLat) && !isNaN(providerLng);
  const hasMyCoords       = !isNaN(myLat) && !isNaN(myLng);

  const [routeInfo,    setRouteInfo]    = useState(null);   // { distance, duration }
  const [routeError,   setRouteError]   = useState('');
  const [loadingRoute, setLoadingRoute] = useState(false);

  useEffect(() => {
    if (!hasProviderCoords) return;
    if (mapInstance.current) return;  // already initialized

    // Init map
    const map = L.map(mapRef.current, { zoomControl: false }).setView(
      [providerLat, providerLng], 15
    );
    mapInstance.current = map;

    // Zoom control bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Provider / pickup pin — green
    const providerMarker = L.marker([providerLat, providerLng], { icon: makePin('#22c55e', '📦 Pickup') })
      .addTo(map)
      .bindPopup(`<strong>📦 ${foodName}</strong><br/>${providerAddress}`, { maxWidth: 220 });

    // Receiver pin — blue (only if coords exist)
    if (hasMyCoords && myRole === 'receiver') {
      L.marker([myLat, myLng], { icon: makePin('#3b82f6', '📍 You') })
        .addTo(map)
        .bindPopup('<strong>📍 Your Location</strong>');

      // Fit bounds to show both pins
      const bounds = L.latLngBounds(
        [providerLat, providerLng],
        [myLat, myLng]
      );
      map.fitBounds(bounds, { padding: [60, 60] });

      // Draw route
      drawRoute(map, myLat, myLng, providerLat, providerLng);
    } else {
      providerMarker.openPopup();
    }

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // ── Draw walking/driving route using OpenRouteService (free) ──
  async function drawRoute(map, fromLat, fromLng, toLat, toLng) {
    setLoadingRoute(true);
    setRouteError('');

    try {
      // OSRM (free, no key needed) — driving route
      const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
      const res  = await fetch(url);
      const data = await res.json();

      if (data.code !== 'Ok' || !data.routes?.length) {
        throw new Error('No route found.');
      }

      const route     = data.routes[0];
      const coords    = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      const distanceM = route.distance;          // metres
      const durationS = route.duration;          // seconds

      // Draw the polyline
      L.polyline(coords, {
        color:     '#3b82f6',
        weight:    5,
        opacity:   0.85,
        lineJoin:  'round',
        lineCap:   'round',
        dashArray: null,
      }).addTo(map);

      // Dashed outline for contrast
      L.polyline(coords, {
        color:   'white',
        weight:  9,
        opacity: 0.25,
      }).addTo(map);

      setRouteInfo({
        distance: distanceM < 1000
          ? `${Math.round(distanceM)} m`
          : `${(distanceM / 1000).toFixed(1)} km`,
        duration: durationS < 60
          ? `${Math.round(durationS)}s`
          : durationS < 3600
            ? `${Math.round(durationS / 60)} min`
            : `${Math.floor(durationS / 3600)}h ${Math.round((durationS % 3600) / 60)}m`,
      });

    } catch (err) {
      console.error('Route error:', err);
      setRouteError('Could not load route. Showing pins only.');

      // Fallback: draw a straight dashed line
      L.polyline([[fromLat, fromLng], [toLat, toLng]], {
        color: '#94a3b8', weight: 3, dashArray: '8, 8',
      }).addTo(map);
    } finally {
      setLoadingRoute(false);
    }
  }

  if (!hasProviderCoords) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ textAlign: 'center', color: '#94a3b8' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>🗺️</div>
        <p>No location data available.</p>
        <button onClick={() => navigate(-1)} style={{ marginTop: '12px', padding: '10px 20px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer' }}>
          ← Go Back
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{
        background: '#075e54',
        padding: '0 16px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        zIndex: 1000,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', fontSize: '20px', padding: '4px', lineHeight: 1 }}
        >
          ←
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: 'white' }}>
            📍 {foodName}
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: '#9de0d9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {providerAddress}
          </p>
        </div>

        {/* Open in Google Maps */}
        <a
          href={`https://www.google.com/maps/dir/?api=1${hasMyCoords ? `&origin=${myLat},${myLng}` : ''}&destination=${providerLat},${providerLng}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: 'rgba(255,255,255,0.15)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '6px 10px',
            fontSize: '12px',
            fontWeight: '600',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Open in Google Maps ↗
        </a>
      </div>

      {/* ── Route info bar ── */}
      {(loadingRoute || routeInfo || routeError) && myRole === 'receiver' && (
        <div style={{
          background: loadingRoute ? '#f0fdf4' : routeError ? '#fff8e1' : '#f0fdf4',
          borderBottom: '1px solid #e2e8f0',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexShrink: 0,
          zIndex: 999,
        }}>
          {loadingRoute && (
            <>
              <span style={{ fontSize: '16px' }}>⌛</span>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Calculating route...</span>
            </>
          )}
          {!loadingRoute && routeInfo && (
            <>
              <div style={{ fontSize: '20px' }}>🚗</div>
              <div>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#166534' }}>
                  {routeInfo.distance}
                </span>
                <span style={{ fontSize: '13px', color: '#64748b', marginLeft: '8px' }}>
                  ~{routeInfo.duration} away
                </span>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#94a3b8' }}>
                via road
              </div>
            </>
          )}
          {!loadingRoute && routeError && (
            <>
              <span style={{ fontSize: '16px' }}>⚠️</span>
              <span style={{ fontSize: '13px', color: '#854d0e' }}>{routeError}</span>
            </>
          )}
        </div>
      )}

      {/* ── Legend ── */}
      <div style={{
        position: 'absolute',
        bottom: '80px',
        left: '16px',
        zIndex: 999,
        background: 'white',
        borderRadius: '10px',
        padding: '8px 12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
        fontSize: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
          <span style={{ color: '#374151' }}>Pickup Location</span>
        </div>
        {hasMyCoords && myRole === 'receiver' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
              <span style={{ color: '#374151' }}>Your Location</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '30px', height: '4px', background: '#3b82f6', borderRadius: '2px', flexShrink: 0 }} />
              <span style={{ color: '#374151' }}>Route</span>
            </div>
          </>
        )}
      </div>

      {/* ── Map ── */}
      <div ref={mapRef} style={{ flex: 1, zIndex: 1 }} />

    </div>
  );
}