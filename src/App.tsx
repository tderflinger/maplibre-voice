import Map from 'react-map-gl/maplibre';
import { NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { VoiceControlButton } from './components/VoiceControlButton';

const MAP_SERVICE = "https://tiles.openfreemap.org/styles/bright";
const MUNICH_LONG = 11.3564;
const MUNICH_LAT = 48.1372;

export function App() {
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
            <VoiceControlButton position="bottom-right" />
        </Map>
    );
}