import Map, { Marker } from 'react-map-gl/maplibre';
import { NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useState } from 'react';
import { VoiceControlButton } from './components/VoiceControlButton';
import type { Park, Museum, POI } from './util/OverpassQuery';

const MAP_SERVICE = "https://tiles.openfreemap.org/styles/bright";
const MUNICH_LONG = 11.3564;
const MUNICH_LAT = 48.1372;

export function App() {
    const [parks, setParks] = useState<Park[]>([]);
    const [museums, setMuseums] = useState<Museum[]>([]);
    const [pois, setPOIs] = useState<POI[]>([]);

    return (
        <Map
            initialViewState={{
                longitude: MUNICH_LONG,
                latitude: MUNICH_LAT,
                zoom: 10
            }}
            style={{ width: '100vw', height: '100vh' }}
            mapStyle={MAP_SERVICE}
        >
            <NavigationControl position="bottom-right" />
            <VoiceControlButton position="bottom-right" onParks={setParks} onMuseums={setMuseums} onPOIs={setPOIs} />
            {parks.map((park, i) => (
                <Marker
                    key={`park-${park.name}-${i}`}
                    longitude={park.longitude}
                    latitude={park.latitude}
                    anchor="bottom"
                >
                    <div title={park.name} style={{ fontSize: 24, cursor: 'pointer' }}>🌳</div>
                </Marker>
            ))}
            {museums.map((museum, i) => (
                <Marker
                    key={`museum-${museum.name}-${i}`}
                    longitude={museum.longitude}
                    latitude={museum.latitude}
                    anchor="bottom"
                >
                    <div title={museum.name} style={{ fontSize: 24, cursor: 'pointer' }}>🏛️</div>
                </Marker>
            ))}
            {pois.map((poi, i) => (
                <Marker
                    key={`poi-${poi.name}-${i}`}
                    longitude={poi.longitude}
                    latitude={poi.latitude}
                    anchor="bottom"
                >
                    <div title={poi.name} style={{ fontSize: 24, cursor: 'pointer' }}>📌</div>
                </Marker>
            ))}
        </Map>
    );
}