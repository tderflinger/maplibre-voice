import { Mistral } from "@mistralai/mistralai";
import { VoiceRecorder } from "../util/VoiceRecorder";
import type { Map as MaplibreMap } from 'maplibre-gl';
import { geocode } from "./GeocoderCall";
import { queryParks, queryMuseums, queryWithMistral, type Park, type Museum, type POI } from "./OverpassQuery";

const STT_MODEL = "voxtral-mini-latest";
const ZOOM_IN = "zoom in";
const ZOOM_OUT = "zoom out";
const FLY = "fly";
const PARKS = "parks";
const MUSEUMS = "museums";

async function handleCommand(
    text: string,
    map: MaplibreMap | undefined,
    client: Mistral,
    onParks?: (parks: Park[]) => void,
    onMuseums?: (museums: Museum[]) => void,
    onPOIs?: (pois: POI[]) => void,
) {
    switch (true) {
        case text.includes(ZOOM_IN):
            console.log('Zooming in!');
            map?.zoomIn();
            break;
        case text.includes(ZOOM_OUT):
            console.log('Zooming out!');
            map?.zoomOut();
            break;
        case text.includes(FLY): {
            const destination = text.substring(text.indexOf(FLY) + FLY.length).trim();
            console.log('Flying to:', destination);
            const coords = await geocode(destination);
            if (coords) {
                map?.flyTo({ center: [coords.longitude, coords.latitude], zoom: 14 });
            } else {
                console.log('Destination not found.');
            }
            break;
        }
        case text.includes(PARKS): {
            if (!map) break;
            const bounds = map.getBounds();
            const south = bounds.getSouth();
            const west = bounds.getWest();
            const north = bounds.getNorth();
            const east = bounds.getEast();
            console.log(`Querying parks in bounds: ${south},${west},${north},${east}`);
            const parks = await queryParks(south, west, north, east);
            console.log(`Found ${parks.length} parks`);
            onParks?.(parks);
            break;
        }
        case text.includes(MUSEUMS): {
            if (!map) break;
            const bounds = map.getBounds();
            const south = bounds.getSouth();
            const west = bounds.getWest();
            const north = bounds.getNorth();
            const east = bounds.getEast();
            console.log(`Querying museums in bounds: ${south},${west},${north},${east}`);
            const museums = await queryMuseums(south, west, north, east);
            console.log(`Found ${museums.length} museums`);
            onMuseums?.(museums);
            break;
        }
        default: {
            if (text?.trim() === '') {
                console.log('Empty transcription, ignoring.');
                break;
            }
            if (!map) break;
            console.log('No built-in command recognized, querying Mistral for Overpass query...');
            const bounds = map.getBounds();
            const pois = await queryWithMistral(
                client,
                text,
                bounds.getSouth(),
                bounds.getWest(),
                bounds.getNorth(),
                bounds.getEast(),
            );
            console.log(`Mistral query returned ${pois.length} POIs`);
            onPOIs?.(pois);
            break;
        }
    }
}

export async function processAudio(
    rec: VoiceRecorder,
    client: Mistral,
    map: MaplibreMap | undefined,
    setSending: (v: boolean) => void,
    onTranscription?: (text: string) => void,
    onParks?: (parks: Park[]) => void,
    onMuseums?: (museums: Museum[]) => void,
    onPOIs?: (pois: POI[]) => void,
) {
    for await (const wavBlob of rec.chunkedStream()) {
        console.log(`Sending ${(wavBlob.size / 1024).toFixed(1)} KB chunk...`);

        const file = new File([wavBlob], "audio.wav", { type: "audio/wav" });
        setSending(true);
        const transcription = await client.audio.transcriptions.complete({
            model: STT_MODEL,
            language: 'en',
            temperature: 0,
            diarize: false,
            file,
        });
        setSending(false);
        console.log('Transcription:', JSON.stringify(transcription));

        const text = transcription.text?.toLowerCase() ?? '';
        onTranscription?.(transcription.text ?? '');
        await handleCommand(text, map, client, onParks, onMuseums, onPOIs);

        console.log("Listening...");
    }
}
