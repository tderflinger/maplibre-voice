import { useMap, useControl } from 'react-map-gl/maplibre';
import { useState, useRef, useEffect } from 'react';
import { VoiceRecorder } from '../util/VoiceRecorder';
import { Mistral } from "@mistralai/mistralai";
import type { IControl, Map as MaplibreMap } from 'maplibre-gl';

const MISTRAL_API_KEY = import.meta.env.VITE_MISTRAL_API_KEY;
const STT_MODEL = "voxtral-mini-latest";

type Position = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

class VoiceButtonControl implements IControl {
    private container: HTMLDivElement;

    constructor(container: HTMLDivElement) {
        this.container = container;
    }

    onAdd(_map: MaplibreMap) {
        this.container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        return this.container;
    }

    onRemove() {
        this.container.parentNode?.removeChild(this.container);
    }
}

export function VoiceControlButton({ position = 'bottom-right' }: { position?: Position }) {
    const { current: map } = useMap();
    const [listening, setListening] = useState(false);
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
            const transcription = await client.audio.transcriptions.complete({
                model: STT_MODEL,
                file,
            });
            console.log('Transcription:', transcription.text ?? transcription);

            const text = transcription.text?.toLowerCase() ?? '';

            if (text.includes("zoom in")) {
                console.log('Zooming in!');
                map?.getMap().zoomIn();
            }

            if (text.includes("zoom out")) {
                console.log('Zooming out!');
                map?.getMap().zoomOut();
            }

            if (text.includes("fly")) {
                console.log('Flying...');
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

        if (listening) {
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
    }, [listening]);

    return null;
}