import { Mistral } from "@mistralai/mistralai";
import { VoiceRecorder } from "../util/VoiceRecorder";
import type { Map as MaplibreMap } from 'maplibre-gl';
import { geocode } from "./GeocoderCall";

const STT_MODEL = "voxtral-mini-latest";
const ZOOM_IN = "zoom in";
const ZOOM_OUT = "zoom out";
const FLY = "fly";

async function handleCommand(text: string, map: MaplibreMap | undefined) {
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
        default:
            console.log('No command recognized in transcription.');
    }
}

export async function processAudio(
    rec: VoiceRecorder,
    client: Mistral,
    map: MaplibreMap | undefined,
    setSending: (v: boolean) => void,
    onTranscription?: (text: string) => void,
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
        await handleCommand(text, map);

        console.log("Listening...");
    }
}
