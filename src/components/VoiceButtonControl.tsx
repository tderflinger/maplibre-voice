import { Map, IControl } from 'maplibre-gl';

export class VoiceButtonControl implements IControl {
    private container: HTMLDivElement;

    constructor(container: HTMLDivElement) {
        this.container = container;
    }

    onAdd(_map: Map) {
        this.container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        return this.container;
    }

    onRemove() {
        this.container.parentNode?.removeChild(this.container);
    }
}
