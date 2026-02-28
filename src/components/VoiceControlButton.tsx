import { useMap, useControl } from 'react-map-gl/maplibre';
import { useState, useRef, useEffect } from 'react';
import { VoiceRecorder } from '../util/VoiceRecorder';
import { Mistral } from "@mistralai/mistralai";
import { VoiceButtonControl } from './VoiceButtonControl';
import { processAudio } from '../util/AudioProcessing';

const MISTRAL_API_KEY = import.meta.env.VITE_MISTRAL_API_KEY;

type Position = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export function VoiceControlButton({ position = 'bottom-right' }: { position?: Position }) {
    const { current: map } = useMap();
    const [listening, setListening] = useState(false);
    const [sending, setSending] = useState(false);
    const [transcription, setTranscription] = useState<string | null>(null);
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

        await processAudio(rec, client, map?.getMap(), setSending, setTranscription);

        setListening(false);
        setRecorder(null);
        setTimeout(() => setTranscription(null), 3000);
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

    return transcription ? (
        <div style={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: 8,
            fontSize: 16,
            fontFamily: 'system-ui, sans-serif',
            zIndex: 1000,
            pointerEvents: 'none',
            maxWidth: '80vw',
            textAlign: 'center',
        }}>
            {transcription}
        </div>
    ) : null;
}