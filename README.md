# maplibre-voice

Maplibre-voice is an experiment to control a MapLibre map with voice commands in the browser.

This proof-of-concept was created at the Mistral Hackathlon 2026. Thanks to Mistral for
organizing this event.



I can see a future where many if not most websites will be voice-enabled.

## Requirements

This applications needs a [Bun](https://bun.sh) runtime installed.

You need to get a Mistral API key and set it in the `.env` file in the maplibre-voice folder.

Like this:

```bash
VITE_MISTRAL_API_KEY=<Your key>
```

## Running

Install the package dependencies with:

```bash
bun install
```

Run the application with:

```bash
bun run dev
```

## Voice Commands

The voice commands need to be given in English. These are the available commands: 

- "zoom in": zoom into map one level
- "zoom out" zoom out of map one level
- "fly + location name + [country name]": e.g. "fly Paris" or "fly fly Paris France". Note that the command is just "fly" and the location name. The country name is optional.

## Security

Note that this is a proof-of-concept and not ready for production. Especially the Mistral
API key is contained in the runtime environment which is not secure.

## Software Stack

- mistralai
- bun: 
- maplibre-gl
- react-map-gl

Code snippets have been taken from the Mistral and MapLibre documentation.

## Third-Party APIs

- Mistral
- Nominatim
- OpenFreeMap: https://openfreemap.org

## License

MIT License