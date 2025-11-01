/**
 * File: App.js
 * Project: CrisisMap – Multi-Disaster Tracker
 *
 * Purpose:
 * --------
 * Root React component for CrisisMap.
 * - Manages application state (disasters, filters, errors).
 * - Passes data down into Map and other components.
 * - Handles Google Maps integration with markers and overlays.
 *
 * Notes:
 * - Uses React hooks (useState, useRef) to track map state.
 * - Connects with backend API for disaster data.
 */


import React, { useState, useEffect, useCallback } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import axios from 'axios';
import './App.css';
import { 
  MapPin, 
  Filter, 
  Clock, 
  AlertTriangle, 
  Flame, 
  Waves, 
  Zap, 
  Cloud,
  RefreshCw,
  Info,
  ExternalLink
} from 'lucide-react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Checkbox } from './components/ui/checkbox';
import { Separator } from './components/ui/separator';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Map loading status component
const MapStatus = ({ status }) => {
  if (status === Status.LOADING) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  if (status === Status.FAILURE) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-dashed border-blue-300 rounded-lg">
        <div className="text-center p-8 max-w-lg">
          <div className="mb-6">
            <div className="bg-white p-4 rounded-full shadow-lg inline-block">
              <AlertTriangle className="h-16 w-16 text-amber-500" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Google Maps Setup Required</h3>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Your Google Maps API key needs to be activated for the Maps JavaScript API to display the interactive map.
          </p>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 text-left">
            <h4 className="font-semibold text-gray-900 mb-2">📋 Setup Steps:</h4>
            <ol className="text-sm text-gray-700 space-y-1">
              <li>1. Open Google Cloud Console</li>
              <li>2. Go to "APIs & Services" → "Library"</li>
              <li>3. Search and enable "Maps JavaScript API"</li>
              <li>4. Add your domain to API key restrictions</li>
              <li>5. Refresh this page</li>
            </ol>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => window.open('https://console.cloud.google.com/google/maps-apis/library', '_blank')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Enable Maps API
            </Button>
            
            <p className="text-sm text-gray-500">
              📊 All disaster data is fully functional in the sidebar →
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// Map component with error handling
const Map = ({ disasters, selectedTypes, onMarkerClick, apiKey }) => {
  const mapRef = React.useRef(null);
  const [map, setMap] = React.useState(null);
  const [markers, setMarkers] = React.useState([]);
  const [mapError, setMapError] = React.useState(null);
  const [showErrorUI, setShowErrorUI] = React.useState(false);

  // Assign a color code to each severity level
// Used to color disaster markers on the map

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'low': return '#22c55e';
      case 'moderate': return '#eab308';
      case 'high': return '#f97316';
      case 'severe': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getDisasterIcon = (type) => {
    const icons = {
      earthquake: '🌋',
      wildfire: '🔥',
      flood: '🌊',
      tornado: '🌪️',
      air_quality: '💨'
    };
    return icons[type] || '⚠️';
  };

  // Check for Maps API error in DOM
  const checkForMapError = React.useCallback(() => {
    if (mapRef.current) {
      const mapContent = mapRef.current.innerHTML;
      if (mapContent.includes('Oops! Something went wrong') || 
          mapContent.includes("This page didn't load Google Maps correctly")) {
        console.log('❌ Detected Google Maps error in DOM, showing custom error UI');
        setShowErrorUI(true);
        setMapError('Google Maps API not activated');
        return true;
      }
    }
    return false;
  }, []);

  React.useEffect(() => {
    if (mapRef.current && !map && window.google && window.google.maps && !showErrorUI) {
      try {
        const newMap = new window.google.maps.Map(mapRef.current, {
          center: { lat: 39.8283, lng: -98.5795 }, // Center of US
          zoom: 5,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          styles: [
            {
              featureType: 'all',
              elementType: 'geometry.fill',
              stylers: [{ color: '#f9fafb' }]
            },
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{ color: '#3b82f6' }]
            },
            {
              featureType: 'landscape',
              elementType: 'geometry',
              stylers: [{ color: '#f3f4f6' }]
            },
            {
              featureType: 'road',
              elementType: 'geometry',
              stylers: [{ color: '#e5e7eb' }]
            }
          ]
        });
        
        // Add error event listener for maps
        newMap.addListener('tilesloaded', () => {
          console.log('✅ Google Maps tiles loaded successfully');
        });
        
        setMap(newMap);
        setMapError(null);
        console.log('✅ Google Maps initialized successfully');
        
        // Check for API errors after initialization
        setTimeout(() => {
          if (!checkForMapError()) {
            console.log('✅ No Google Maps API errors detected');
          }
        }, 3000);
        
      } catch (error) {
        console.error('❌ Error initializing Google Maps:', error);
        setMapError(error.message);
        setShowErrorUI(true);
      }
    }
  }, [map, showErrorUI, checkForMapError]);

  // Check for errors periodically
  React.useEffect(() => {
    const errorCheckInterval = setInterval(() => {
      if (mapRef.current && !showErrorUI) {
        checkForMapError();
      }
    }, 2000);

    return () => clearInterval(errorCheckInterval);
  }, [showErrorUI, checkForMapError]);

  React.useEffect(() => {
    if (map && disasters.length > 0 && window.google && !showErrorUI) {
      try {
        // Clear existing markers
        markers.forEach(marker => {
          if (marker && marker.setMap) {
            marker.setMap(null);
          }
        });
        
        const newMarkers = disasters
          .filter(disaster => selectedTypes.includes(disaster.disaster_type))
          .map(disaster => {
            try {
              const marker = new window.google.maps.Marker({
                position: { lat: disaster.latitude, lng: disaster.longitude },
                map: map,
                title: disaster.title,
                icon: {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 12,
                  fillColor: getSeverityColor(disaster.severity),
                  fillOpacity: 0.8,
                  strokeColor: '#ffffff',
                  strokeWeight: 2
                }
              });

              const infoWindow = new window.google.maps.InfoWindow({
                content: `
                  <div style="color: #1f2937; max-width: 250px; font-family: system-ui, -apple-system, sans-serif;">
                    <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">
                      ${getDisasterIcon(disaster.disaster_type)} ${disaster.title}
                    </h3>
                    <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">
                      ${disaster.description}
                    </p>
                    <div style="margin: 8px 0; padding: 4px 8px; background: ${getSeverityColor(disaster.severity)}; color: white; border-radius: 4px; display: inline-block; font-size: 12px; text-transform: uppercase; font-weight: 600;">
                      ${disaster.severity}
                    </div>
                    <p style="margin: 4px 0; color: #9ca3af; font-size: 12px;">
                      📍 ${disaster.location_name}
                    </p>
                    <p style="margin: 4px 0; color: #9ca3af; font-size: 12px;">
                      🕒 ${new Date(disaster.timestamp).toLocaleString()}
                    </p>
                    ${disaster.magnitude ? `<p style="margin: 2px 0; color: #374151; font-size: 12px;"><strong>Magnitude:</strong> ${disaster.magnitude}</p>` : ''}
                    ${disaster.acres_burned ? `<p style="margin: 2px 0; color: #374151; font-size: 12px;"><strong>Acres Burned:</strong> ${disaster.acres_burned.toLocaleString()}</p>` : ''}
                    ${disaster.wind_speed ? `<p style="margin: 2px 0; color: #374151; font-size: 12px;"><strong>Wind Speed:</strong> ${disaster.wind_speed} mph</p>` : ''}
                    ${disaster.aqi_value ? `<p style="margin: 2px 0; color: #374151; font-size: 12px;"><strong>AQI:</strong> ${disaster.aqi_value}</p>` : ''}
                  </div>
                `
              });

              marker.addListener('click', () => {
                infoWindow.open(map, marker);
                onMarkerClick(disaster);
              });

              return marker;
            } catch (error) {
              console.error('Error creating marker:', error);
              return null;
            }
          })
          .filter(marker => marker !== null);

        setMarkers(newMarkers);
        console.log(`✅ Created ${newMarkers.length} markers on map`);
      } catch (error) {
        console.error('❌ Error updating markers:', error);
      }
    }
  }, [map, disasters, selectedTypes, onMarkerClick, showErrorUI]);

  // Show custom error UI when Maps API error is detected
  if (showErrorUI || mapError) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-dashed border-blue-300 rounded-lg">
        <div className="text-center p-8 max-w-lg">
          <div className="mb-6">
            <div className="bg-white p-4 rounded-full shadow-lg inline-block">
              <AlertTriangle className="h-16 w-16 text-amber-500" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Google Maps Setup Required</h3>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Your Google Maps API key needs to be activated for the Maps JavaScript API to display the interactive disaster map.
          </p>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 text-left">
            <h4 className="font-semibold text-gray-900 mb-2">📋 Quick Setup:</h4>
            <ol className="text-sm text-gray-700 space-y-1">
              <li>1. Click "Enable Maps API" below</li>
              <li>2. Enable "Maps JavaScript API"</li>
              <li>3. Configure API key restrictions (optional)</li>
              <li>4. Refresh this page</li>
            </ol>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => window.open('https://console.cloud.google.com/google/maps-apis/library/maps-javascript-api', '_blank')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Enable Maps API
            </Button>
            
            <p className="text-sm text-gray-500">
              📊 All disaster tracking features work perfectly without the map
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
};

// Disaster type configuration
const disasterTypes = [
  { id: 'earthquake', label: 'Earthquakes', icon: Zap, color: 'text-orange-500' },
  { id: 'wildfire', label: 'Wildfires', icon: Flame, color: 'text-red-500' },
  { id: 'flood', label: 'Floods', icon: Waves, color: 'text-blue-500' },
  { id: 'tornado', label: 'Tornadoes', icon: Cloud, color: 'text-purple-500' },
  { id: 'air_quality', label: 'Air Quality', icon: Cloud, color: 'text-gray-500' }
];

// Severity badge component
const SeverityBadge = ({ severity }) => {
  const variants = {
    low: 'bg-green-100 text-green-800 border-green-300',
    moderate: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    high: 'bg-orange-100 text-orange-800 border-orange-300',
    severe: 'bg-red-100 text-red-800 border-red-300'
  };

  return (
    <Badge className={`${variants[severity]} border capitalize font-medium`}>
      {severity}
    </Badge>
  );
};

// Disaster card component
const DisasterCard = ({ disaster, onClick }) => {
  const typeConfig = disasterTypes.find(t => t.id === disaster.disaster_type);
  const IconComponent = typeConfig?.icon || AlertTriangle;

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.abs(now - date) / 36e5;
    
    if (diffInHours < 1) {
      return `${Math.round(diffInHours * 60)} minutes ago`;
    } else if (diffInHours < 24) {
      return `${Math.round(diffInHours)} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4"
      style={{ borderLeftColor: typeConfig ? (disaster.severity === 'severe' ? '#ef4444' : disaster.severity === 'high' ? '#f97316' : disaster.severity === 'moderate' ? '#eab308' : '#22c55e') : '#6b7280' }}
      onClick={() => onClick(disaster)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <IconComponent className={`h-5 w-5 ${typeConfig?.color || 'text-gray-500'}`} />
            <CardTitle className="text-sm font-medium text-gray-900 line-clamp-2">
              {disaster.title}
            </CardTitle>
          </div>
          <SeverityBadge severity={disaster.severity} />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {disaster.description}
        </p>
        <div className="space-y-2">
          <div className="flex items-center text-xs text-gray-500">
            <MapPin className="h-3 w-3 mr-1" />
            {disaster.location_name}
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <Clock className="h-3 w-3 mr-1" />
            {formatTimestamp(disaster.timestamp)}
          </div>
          {disaster.magnitude && (
            <div className="text-xs text-gray-600">
              <strong>Magnitude:</strong> {disaster.magnitude}
            </div>
          )}
          {disaster.acres_burned && (
            <div className="text-xs text-gray-600">
              <strong>Acres Burned:</strong> {disaster.acres_burned.toLocaleString()}
            </div>
          )}
          {disaster.wind_speed && (
            <div className="text-xs text-gray-600">
              <strong>Wind Speed:</strong> {disaster.wind_speed} mph
            </div>
          )}
          {disaster.aqi_value && (
            <div className="text-xs text-gray-600">
              <strong>AQI:</strong> {disaster.aqi_value}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Main App component
function App() {
  const [disasters, setDisasters] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState(['earthquake', 'wildfire', 'flood', 'tornado', 'air_quality']);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [mapsApiKey, setMapsApiKey] = useState('');
  const [selectedDisaster, setSelectedDisaster] = useState(null);
  const [mapsError, setMapsError] = useState(false);

  // Fetch Google Maps API key
  const fetchMapsConfig = async () => {
    try {
      const response = await axios.get(`${API}/maps/config`);
      const apiKey = response.data.apiKey;
      setMapsApiKey(apiKey);
      
      // Validate API key format
      if (!apiKey || !apiKey.startsWith('AIza')) {
        console.warn('⚠️ Invalid Google Maps API key format');
        setMapsError(true);
      } else {
        console.log('✅ Google Maps API key loaded');
      }
    } catch (error) {
      console.error('❌ Error fetching maps config:', error);
      setMapsError(true);
    }
  };

  // Fetch disasters data
  const fetchDisasters = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/disasters`);
      setDisasters(response.data);
      setLastUpdated(new Date());
      console.log(`✅ Loaded ${response.data.length} disasters`);
    } catch (error) {
      console.error('❌ Error fetching disasters:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize mock data
  const initializeMockData = async () => {
    try {
      setLoading(true);
      await axios.post(`${API}/disasters/initialize`);
      await fetchDisasters();
      console.log('✅ Mock data initialized');
    } catch (error) {
      console.error('❌ Error initializing mock data:', error);
    }
  };

  // Sync earthquake data
  const syncEarthquakeData = async () => {
    try {
      setLoading(true);
      console.log('🌍 Syncing earthquake data from USGS...');
      const response = await axios.post(`${API}/disasters/sync-earthquakes`);
      console.log('✅ Earthquake sync response:', response.data);
      await fetchDisasters();
    } catch (error) {
      console.error('❌ Error syncing earthquake data:', error);
    }
  };

  // Toggle disaster type filter
  const toggleDisasterType = (typeId) => {
    setSelectedTypes(prev => 
      prev.includes(typeId) 
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  // Handle marker click
  const handleMarkerClick = useCallback((disaster) => {
    setSelectedDisaster(disaster);
    console.log('📍 Selected disaster:', disaster.title);
  }, []);

  // Handle maps loading status
  const handleMapsStatus = (status) => {
    console.log('🗺️ Maps loading status:', status);
    if (status === Status.FAILURE) {
      setMapsError(true);
    }
    
    // Listen for the specific API error
    if (status === Status.SUCCESS) {
      setTimeout(() => {
        // Check for API error after Maps loads
        const errorElements = document.querySelectorAll('.gm-err-content');
        if (errorElements.length > 0) {
          console.log('❌ Detected Google Maps API error via DOM inspection');
          setMapsError(true);
        }
      }, 2000);
    }
  };

  // Initialize data on component mount
  useEffect(() => {
    const initializeApp = async () => {
      console.log('🚀 Initializing CrisisMap...');
      await fetchMapsConfig();
      await fetchDisasters();
      
      // If no disasters found, initialize with mock data
      const response = await axios.get(`${API}/disasters`);
      if (response.data.length === 0) {
        console.log('📊 No disasters found, loading mock data...');
        await initializeMockData();
      }
    };
    
    // Add global error handler for Google Maps API errors
    const handleGlobalError = (event) => {
      if (event.message && (
        event.message.includes('ApiNotActivatedMapError') || 
        event.message.includes('Google Maps JavaScript API error')
      )) {
        console.log('❌ Detected Google Maps API error globally, showing setup instructions');
        setMapsError(true);
      }
    };
    
    window.addEventListener('error', handleGlobalError);
    
    initializeApp();
    
    return () => {
      window.removeEventListener('error', handleGlobalError);
    };
  }, []);

  const filteredDisasters = disasters.filter(disaster => 
    selectedTypes.includes(disaster.disaster_type)
  );

  const getSummaryStats = () => {
    const stats = {};
    selectedTypes.forEach(type => {
      stats[type] = disasters.filter(d => d.disaster_type === type).length;
    });
    return stats;
  };

  const summaryStats = getSummaryStats();

  // Show loading screen while initializing
  if (loading && disasters.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-2">Loading CrisisMap...</p>
          <p className="text-sm text-gray-500">Initializing disaster tracking system</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-red-600 p-2 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">CrisisMap</h1>
                <p className="text-sm text-gray-600">Multi-Disaster Tracker for US & Canada</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                onClick={syncEarthquakeData}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Sync Live Data
              </Button>
              
              {lastUpdated && (
                <div className="text-xs text-gray-500">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters and Summary */}
          <div className="lg:col-span-1 space-y-6">
            {/* Filter Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Filter className="h-5 w-5 mr-2" />
                  Disaster Types
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {disasterTypes.map(type => {
                  const IconComponent = type.icon;
                  return (
                    <div key={type.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={type.id}
                        checked={selectedTypes.includes(type.id)}
                        onCheckedChange={() => toggleDisasterType(type.id)}
                      />
                      <label 
                        htmlFor={type.id}
                        className="flex items-center space-x-2 cursor-pointer flex-1"
                      >
                        <IconComponent className={`h-4 w-4 ${type.color}`} />
                        <span className="text-sm font-medium">{type.label}</span>
                        <Badge variant="secondary" className="ml-auto">
                          {summaryStats[type.id] || 0}
                        </Badge>
                      </label>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={initializeMockData}
                  variant="outline" 
                  className="w-full justify-start"
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset Mock Data
                </Button>
                <Button 
                  onClick={fetchDisasters}
                  variant="outline" 
                  className="w-full justify-start"
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh All
                </Button>
              </CardContent>
            </Card>

            {/* Selected Disaster Info */}
            {selectedDisaster && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Info className="h-5 w-5 mr-2" />
                    Selected Event
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DisasterCard 
                    disaster={selectedDisaster} 
                    onClick={() => {}} 
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Map */}
          <div className="lg:col-span-2">
            <Card className="h-[600px]">
              <CardContent className="h-full p-0">
                {mapsApiKey && !mapsError ? (
                  <Wrapper 
                    apiKey={mapsApiKey}
                    render={(status) => {
                      if (status === Status.LOADING) {
                        return (
                          <div className="flex items-center justify-center h-full bg-gray-100">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                              <p className="text-sm text-gray-600">Loading Google Maps...</p>
                            </div>
                          </div>
                        );
                      }

                      if (status === Status.FAILURE) {
                        return (
                          <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-dashed border-blue-300 rounded-lg">
                            <div className="text-center p-8 max-w-lg">
                              <div className="mb-6">
                                <div className="bg-white p-4 rounded-full shadow-lg inline-block">
                                  <AlertTriangle className="h-16 w-16 text-amber-500" />
                                </div>
                              </div>
                              <h3 className="text-xl font-bold text-gray-900 mb-3">Google Maps Setup Required</h3>
                              <p className="text-gray-600 mb-4 leading-relaxed">
                                Your Google Maps API key needs to be activated for the Maps JavaScript API to display the interactive disaster map.
                              </p>
                              
                              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 text-left">
                                <h4 className="font-semibold text-gray-900 mb-2">📋 Quick Setup:</h4>
                                <ol className="text-sm text-gray-700 space-y-1">
                                  <li>1. Click "Enable Maps API" below</li>
                                  <li>2. Enable "Maps JavaScript API"</li>
                                  <li>3. Configure API key restrictions (optional)</li>
                                  <li>4. Refresh this page</li>
                                </ol>
                              </div>

                              <div className="space-y-3">
                                <Button 
                                  onClick={() => window.open('https://console.cloud.google.com/google/maps-apis/library/maps-javascript-api', '_blank')}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Enable Maps API
                                </Button>
                                
                                <p className="text-sm text-gray-500">
                                  📊 All disaster tracking features work perfectly without the map
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return null;
                    }}
                    callback={(status) => {
                      console.log('🗺️ Maps loading status:', status);
                      if (status === Status.FAILURE) {
                        setMapsError(true);
                      }
                      
                      // Listen for the specific API error
                      if (status === Status.SUCCESS) {
                        setTimeout(() => {
                          // Check for API error after Maps loads
                          const errorElements = document.querySelectorAll('.gm-err-content');
                          if (errorElements.length > 0) {
                            console.log('❌ Detected Google Maps API error via DOM inspection');
                            setMapsError(true);
                          }
                        }, 2000);
                      }
                    }}
                    libraries={['marker']}
                  >
                    <Map
                      disasters={disasters}
                      selectedTypes={selectedTypes}
                      onMarkerClick={handleMarkerClick}
                      apiKey={mapsApiKey}
                    />
                  </Wrapper>
                ) : (
                  <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-dashed border-blue-300 rounded-lg">
                    <div className="text-center p-8 max-w-lg">
                      <div className="mb-6">
                        <div className="bg-white p-4 rounded-full shadow-lg inline-block">
                          <AlertTriangle className="h-16 w-16 text-amber-500" />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Google Maps Setup Required</h3>
                      <p className="text-gray-600 mb-4 leading-relaxed">
                        To display the interactive disaster map, please activate the Maps JavaScript API for your Google Cloud project.
                      </p>
                      
                      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 text-left">
                        <h4 className="font-semibold text-gray-900 mb-2">📋 Quick Setup:</h4>
                        <ol className="text-sm text-gray-700 space-y-1">
                          <li>1. Click "Enable Maps API" below</li>
                          <li>2. Enable "Maps JavaScript API"</li>
                          <li>3. Configure API key restrictions</li>
                          <li>4. Refresh this page</li>
                        </ol>
                      </div>

                      <div className="space-y-3">
                        <Button 
                          onClick={() => window.open('https://console.cloud.google.com/google/maps-apis/library/maps-javascript-api', '_blank')}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Enable Maps API
                        </Button>
                        
                        <p className="text-sm text-gray-500">
                          📊 All disaster tracking features work perfectly without the map
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Disaster List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Recent Events ({filteredDisasters.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[520px] overflow-y-auto">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-500">Loading disasters...</p>
                    </div>
                  ) : filteredDisasters.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">No disasters found</p>
                      <Button onClick={initializeMockData} size="sm">
                        Load Sample Data
                      </Button>
                    </div>
                  ) : (
                    filteredDisasters.map(disaster => (
                      <DisasterCard
                        key={disaster.id}
                        disaster={disaster}
                        onClick={setSelectedDisaster}
                      />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;