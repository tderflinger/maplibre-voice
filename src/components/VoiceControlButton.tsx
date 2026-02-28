import { useMap, useControl } from 'react-map-gl/maplibre';
import { useState, useRef, useEffect } from 'react';
import { VoiceRecorder } from '../util/VoiceRecorder';
import { Mistral } from "@mistralai/mistralai";
import { VoiceButtonControl } from './VoiceButtonControl';
import { geocode } from '../util/GeocoderCall';

const MISTRAL_API_KEY = import.meta.env.VITE_MISTRAL_API_KEY;
const STT_MODEL = "voxtral-mini-latest";
const ZOOM_IN = "zoom in";
const ZOOM_OUT = "zoom out";
const FLY = "fly";

type Position = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export function VoiceControlButton({ position = 'bottom-right' }: { position?: Position }) {
    const { current: map } = useMap();
    const [listening, setListening] = useState(false);
    const [sending, setSending] = useState(false);
    const [recorder, setRecorder] = useState<VoiceRecorder | null>(null);
    const containerRef = useRef<HTMLDivElement>(document.createElement('div'));

    useControl(() => new VoiceButtonControl(containerRef.current), { position });

    const handleClick = async () => {
        if (listening && recorder) {
            recorder.stop();
            setRecorder(null);
            setListening(false);
            console.log('Stopped listening.');
            return;
        }

        console.log('Voice control clicked');
        setListening(true);
        const client = new Mistral({ apiKey: MISTRAL_API_KEY });
        const rec = new VoiceRecorder();
        setRecorder(rec);
        await rec.start();

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
            switch (true) {
                case text.includes(ZOOM_IN):
                    console.log('Zooming in!');
                    map?.getMap().zoomIn();
                    break;
                case text.includes(ZOOM_OUT):
                    console.log('Zooming out!');
                    map?.getMap().zoomOut();
                    break;
                case text.includes(FLY):
                    const destination = text.substring(text.indexOf(FLY) + FLY.length).trim();
                    console.log('Flying to:', destination);
                    const coords = await geocode(destination);
                    if (coords) {
                        map?.getMap().flyTo({ center: [coords.longitude, coords.latitude], zoom: 14 });
                    } else {
                        console.log('Destination not found.');
                    }
                    break;
                default:
                    console.log('No command recognized in transcription.');
            }

            console.log("Listening...");
        }

        setListening(false);
        setRecorder(null);
    };

    useEffect(() => {
        const container = containerRef.current;
        container.innerHTML = '';
        const button = document.createElement('button');
        button.type = 'button';
        button.title = listening ? 'Stop listening' : 'Voice Control';
        button.style.fontSize = '18px';
        button.style.cursor = 'pointer';

        if (sending) {
            button.textContent = '📡';
        } else if (listening) {
            const span = document.createElement('span');
            span.style.display = 'inline-block';
            span.style.width = '10px';
            span.style.height = '10px';
            span.style.backgroundColor = 'black';
            span.style.borderRadius = '2px';
            button.appendChild(span);
        } else {
            button.textContent = '🎤';
        }

        button.addEventListener('click', handleClick);
        container.appendChild(button);

        return () => {
            button.removeEventListener('click', handleClick);
        };
    }, [listening, sending]);

    return null;
}