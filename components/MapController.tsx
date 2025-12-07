import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Search, Loader2 } from 'lucide-react';
import { Coordinate, DrawingState, ProfileLine } from '../types';

// Fix Leaflet default icon issues in Webpack/React environments
const iconUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapControllerProps {
  lines: ProfileLine[];
  drawingState: DrawingState;
  onMapClick: (coord: Coordinate) => void;
  onMapRightClick: () => void;
  tempStartPoint: Coordinate | null;
}

const MapEvents: React.FC<{ onClick: (e: L.LeafletMouseEvent) => void; onRightClick: () => void }> = ({ onClick, onRightClick }) => {
  useMapEvents({
    click: onClick,
    contextmenu: (e) => {
      e.originalEvent.preventDefault();
      onRightClick();
    },
  });
  return null;
};

// Search Component to fly to location
const SearchControl = () => {
  const map = useMap();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        map.flyTo([parseFloat(lat), parseFloat(lon)], 10);
      } else {
        alert('未找到该地点');
      }
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute top-4 right-4 z-[1000]">
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索地点..."
          className="w-64 h-10 pl-4 pr-10 rounded-xl bg-neu-base shadow-neu-out border border-white/50 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-gray-400/50 transition-all placeholder-gray-400"
        />
        <button
          type="submit"
          disabled={loading}
          className="absolute right-2 top-2 p-1 text-gray-500 hover:text-gray-700"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
};

export const MapController: React.FC<MapControllerProps> = ({ 
  lines, 
  drawingState, 
  onMapClick, 
  onMapRightClick,
  tempStartPoint 
}) => {
  // Custom marker icon for start/end points to look cleaner
  const createDotIcon = (color: string) => L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });

  return (
    <MapContainer 
      center={[35, 105]} 
      zoom={4} 
      style={{ height: '100%', width: '100%', borderRadius: '1rem' }}
      zoomControl={false}
      minZoom={2}
      maxBounds={[[-90, -180], [90, 180]]}
      maxBoundsViscosity={1.0}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="brightness-95 contrast-[0.9] saturate-[0.8]" // Slight filter to match neumorphic feel
        noWrap={true}
      />
      
      <SearchControl />
      <MapEvents onClick={(e) => onMapClick(e.latlng)} onRightClick={onMapRightClick} />

      {/* Render Finished Lines */}
      {lines.map((line) => (
        <React.Fragment key={line.id}>
          <Polyline 
            positions={[line.start, line.end]} 
            pathOptions={{ color: line.color, weight: 4, opacity: 0.8 }} 
          />
          <Marker position={line.start} icon={createDotIcon(line.color)} />
          <Marker position={line.end} icon={createDotIcon(line.color)} />
        </React.Fragment>
      ))}

      {/* Render Work-In-Progress Line */}
      {drawingState === DrawingState.WAITING_FOR_SECOND_POINT && tempStartPoint && (
        <Marker position={tempStartPoint} icon={createDotIcon('#4a5568')} />
      )}
    </MapContainer>
  );
};