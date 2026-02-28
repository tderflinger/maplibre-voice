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

## Security

Note that this is a proof-of-concept and not ready for production. Especially the Mistral
API key is contained in the runtime environment which is not secure.

## Software Stack

- mistralai
- bun: 
- maplibre-gl
- react-map-gl
- OpenFreeMap: https://openfreemap.org

## License

MIT License