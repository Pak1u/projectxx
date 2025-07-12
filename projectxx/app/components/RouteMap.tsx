"use client";

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { 
  ssr: false,
  loading: () => <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
    <p className="text-gray-500">Loading map...</p>
  </div>
});
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then(mod => mod.Polyline), { ssr: false });

// Map bounds component that uses useMap hook
const MapBoundsComponent = ({ locations }: { locations: Location[] }) => {
  const useMap = require('react-leaflet').useMap;
  const map = useMap();
  
  useEffect(() => {
    if (locations.length > 0) {
      const bounds = L.latLngBounds(
        locations.map(loc => [loc.coordinate.lat, loc.coordinate.lon])
      );
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [locations.length, map]);
  
  return null;
};

// Fix for default markers in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Coordinate {
  lat: number;
  lon: number;
}

interface Location {
  id: string;
  name: string;
  coordinate: Coordinate;
  type: 'warehouse' | 'store';
}

interface RouteMapProps {
  warehouse: Coordinate | null;
  stores: Coordinate[];
  tour: number[] | null;
  warehouseName?: string;
  storeNames?: string[];
  loading?: boolean;
}

interface RouteSegment {
  coordinates: [number, number][];
  distance: number;
  duration: number;
}

export default function RouteMap({ 
  warehouse, 
  stores, 
  tour, 
  warehouseName = "Warehouse",
  storeNames = [],
  loading = false 
}: RouteMapProps) {
  const [routeSegments, setRouteSegments] = useState<RouteSegment[]>([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Create locations array using useMemo to prevent recreation on every render
  const locations: Location[] = React.useMemo(() => {
    const locs: Location[] = [];
    if (warehouse) {
      locs.push({
        id: 'warehouse',
        name: warehouseName,
        coordinate: warehouse,
        type: 'warehouse'
      });
    }
    
    stores.forEach((store, index) => {
      locs.push({
        id: `store-${index}`,
        name: storeNames[index] || `Store ${index + 1}`,
        coordinate: store,
        type: 'store'
      });
    });
    return locs;
  }, [warehouse, stores, warehouseName, storeNames]);

  // Get route segments for the tour
  const fetchRouteSegments = React.useCallback(async (tourSequence: number[]) => {
    if (tourSequence.length < 2) return;
    
    setRouteLoading(true);
    setRouteError(null);
    
    try {
      // Create coordinates array in the order of the tour
      const coordinates = tourSequence.map(index => {
        const location = locations[index];
        return { lat: location.coordinate.lat, lon: location.coordinate.lon };
      });
      
      // Call backend API to get all route segments at once
      const response = await fetch('http://localhost:4000/api/route-coordinates/route-segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coordinates: coordinates,
          tour: tourSequence
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get route segments');
      }
      
      const data = await response.json();
      // console.log('Route segments received:', data.segments);
      setRouteSegments(data.segments);
    } catch (error: any) {
      setRouteError(error.message);
      // console.error('Error fetching route segments:', error);
    } finally {
      setRouteLoading(false);
    }
  }, [locations]); // Add locations as dependency for useCallback

  // Fetch route when tour changes
  useEffect(() => {
    // console.log('Tour changed:', tour, 'Locations length:', locations.length);
    if (tour && tour.length > 1 && locations.length > 0) {
      // console.log('Fetching route segments for tour:', tour);
      fetchRouteSegments(tour);
    } else {
      // console.log('Clearing route segments');
      setRouteSegments([]);
    }
  }, [tour, locations.length, fetchRouteSegments]); // Include fetchRouteSegments in dependencies



  if (!warehouse && stores.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">No locations to display on map</p>
      </div>
    );
  }

  const getMarkerIcon = (type: 'warehouse' | 'store') => {
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ${
          type === 'warehouse' 
            ? 'bg-blue-600 border-2 border-blue-800' 
            : 'bg-green-600 border-2 border-green-800'
        }">
          ${type === 'warehouse' ? 'W' : 'S'}
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  };

  const getRouteColor = (index: number) => {
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
    return colors[index % colors.length];
  };

  const getLocationName = (index: number) => {
    if (index === 0) {
      return warehouseName;
    }
    const storeIndex = index - 1;
    if (storeIndex < stores.length) {
      return storeNames[storeIndex] || `Store ${index}`;
    }
    return `Store ${index}`;
  };

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border shadow-lg">
      <MapContainer
        center={warehouse ? [warehouse.lat, warehouse.lon] : [0, 0]}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
      >
        <MapBoundsComponent locations={locations} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Location Markers */}
        {locations.map((location, index) => (
          <Marker
            key={location.id}
            position={[location.coordinate.lat, location.coordinate.lon]}
            icon={getMarkerIcon(location.type)}
          >
            <Popup>
              <div className="text-center">
                <h3 className="font-semibold text-gray-800">
                  {location.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {location.type === 'warehouse' ? 'Warehouse' : 'Store'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {location.coordinate.lat.toFixed(4)}, {location.coordinate.lon.toFixed(4)}
                </p>
                {tour && (
                  <div className="mt-2 p-2 bg-blue-50 rounded border">
                    <p className="text-xs font-bold text-blue-800">
                      Route Stop #{tour.indexOf(index) + 1} of {tour.length}
                    </p>
                    {tour.indexOf(index) > 0 && (
                      <p className="text-xs text-blue-600">
                        From: {getLocationName(tour[tour.indexOf(index) - 1])}
                      </p>
                    )}
                    {tour.indexOf(index) < tour.length - 1 && (
                      <p className="text-xs text-blue-600">
                        To: {getLocationName(tour[tour.indexOf(index) + 1])}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Route Lines */}
        {/* console.log('Rendering route segments:', routeSegments.length) */}
        {routeSegments.map((segment, index) => {
          // console.log('Segment coordinates:', segment.coordinates);
          // Convert from [lng, lat] to [lat, lng] for Leaflet
          const leafletCoordinates = segment.coordinates.map(coord => [coord[1], coord[0]] as [number, number]);
          // console.log('Converted coordinates:', leafletCoordinates);
          
          // Calculate midpoint for route number label
          const midPoint = Math.floor(leafletCoordinates.length / 2);
          const labelPosition = leafletCoordinates[midPoint] as [number, number];
          
          return (
            <React.Fragment key={index}>
              <Polyline
                positions={leafletCoordinates}
                color={getRouteColor(index)}
                weight={4}
                opacity={0.8}
              >
                <Popup>
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-800">Route Segment {index + 1}</h3>
                    <p className="text-sm text-gray-600">
                      From: {tour ? getLocationName(tour[index]) : `Stop ${index + 1}`}
                    </p>
                    <p className="text-sm text-gray-600">
                      To: {tour ? getLocationName(tour[index + 1]) : `Stop ${index + 2}`}
                    </p>
                    <p className="text-sm text-gray-600">
                      Distance: {(segment.distance / 1000).toFixed(2)} km
                    </p>
                    <p className="text-sm text-gray-600">
                      Duration: {Math.round(segment.duration / 60)} min
                    </p>
                  </div>
                </Popup>
              </Polyline>
              
              {/* Route Number Label */}
              <Marker
                position={labelPosition}
                icon={L.divIcon({
                  className: 'route-number-marker',
                  html: `
                    <div class="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg bg-red-600 border-2 border-white">
                      ${index + 1}
                    </div>
                  `,
                  iconSize: [24, 24],
                  iconAnchor: [12, 12]
                })}
              >
                <Popup>
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-800">Route Step {index + 1}</h3>
                    <p className="text-sm text-gray-600">
                      {tour ? getLocationName(tour[index]) : `Stop ${index + 1}`} → {tour ? getLocationName(tour[index + 1]) : `Stop ${index + 2}`}
                    </p>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>
      
      {/* Loading Overlay */}
      {(loading || routeLoading) && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">
              {routeLoading ? 'Calculating route...' : 'Loading map...'}
            </p>
          </div>
        </div>
      )}
      
      {/* Error Display */}
      {routeError && (
        <div className="absolute top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded z-10">
          <p className="text-sm">{routeError}</p>
        </div>
      )}
      
      {/* Route Summary */}
      {routeSegments.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 p-3 rounded-lg shadow-lg z-10">
          <h3 className="font-semibold text-gray-800 mb-2">Route Summary</h3>
          <div className="text-sm text-gray-600">
            <p>Total Distance: {(routeSegments.reduce((sum, seg) => sum + seg.distance, 0) / 1000).toFixed(2)} km</p>
            <p>Total Time: {Math.round(routeSegments.reduce((sum, seg) => sum + seg.duration, 0) / 60)} min</p>
            <p>Stops: {routeSegments.length + 1}</p>
          </div>
        </div>
      )}
      
      {/* Route Legend */}
      {routeSegments.length > 0 && (
        <div className="absolute top-4 left-4 bg-white bg-opacity-90 p-3 rounded-lg shadow-lg z-10 max-w-xs">
          <h3 className="font-semibold text-gray-800 mb-2">Route Order</h3>
          <div className="text-sm text-gray-600 space-y-1">
            {tour && tour.map((stopIndex, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-5 h-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <span className="text-gray-700">{getLocationName(stopIndex)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 