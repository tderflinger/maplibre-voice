![Weblibre-voice logo](./assets/maplibre-voice-logo.png)

# maplibre-voice

Maplibre-voice is an experiment to control a [MapLibre](https://maplibre.org) map with voice commands in the browser.

This proof-of-concept was created at the [Mistral Hackathlon 2026](https://worldwide-hackathon.mistral.ai/). Thanks to Mistral for organizing this event.

Note that `maplibre-voice` has no affiliation with the MapLibre project. The idea was
to make out of this experiment a MapLibre plugin in the future.

## What does MapLibre-voice Do?

The experiment `maplibre-voice` lets you control a map in the browser with voice commands.
There are not only fixed commands, but you can speak any command you can think of. The
LLM behind this application will try to understand the command and transform it into an
API query that returns the data. The result is parsed and displayed on the map as pins.

This dynamic capability sets this project apart from similar attempts at controlling a map
with voice commands.

## Vision Vox 💬

I find it astonishing that currently not more websites offer voice input or voice navigation.
So I think we should change that because voice offers an alternative way of navigating the web.
Voice control is not only useful for disabled people but for everyone.

I can see a future where many, if not most websites will be voice-enabled.

## Requirements 📋 

This applications needs a [Bun](https://bun.sh) runtime installed.

You need to get a Mistral API key and set it in the `.env` file in the `maplibre-voice` folder.

Like this:

.env
```bash
VITE_MISTRAL_API_KEY=<Your key>
```

## Running 🚀

Check out the code with git and install the package dependencies with:

```bash
bun install
```

Run the application with:

```bash
bun run dev
```

In the browser navigate to `http://localhost:5173`.

## Voice Commands 🎤

The voice commands need to be given in English. There are a number of fixed commands
available. When these fixed commands are not recognized, there is made an attempt
to generate a map query for __any dynamic command__.

These are the available fixed commands: 

- `zoom in`: zoom into map one level
- `zoom out`: zoom out of map one level
- `fly + location name + [country name]`: e.g. `fly Paris` or `fly Paris France`. Note that the command is just `fly` and the location name. The country name is optional.
- `parks`: fetches all public parks in the current viewport of the map and displays them in the form of tree icons. 
- `museums`: fetches all museums in the current viewport of the map and displays them in the form of a museum icon.  

Note for the `parks` and `museums` commands: These two commands connect to the OpenStreetMap (OSM) Overpass API server. Please do not use a too high-level zoom because then a lot of data will be queried which might overwhelm the OSM Overpass server. 

You have exactly five seconds to voice your command. The data is then send to the server and
transcribed. During sending and transmission, no voice input is possible. The icons in the
control mirror the state.

Why five seconds? I could not make the Mistral realtime transcription API (voxtral-mini-transcribe-realtime-2602) work in the browser. Once
the Mistral realtime voice API works, the user experience can be further improved for this project. 

Five second seemed like a good compromise between having enough time to state the command and waiting for the action.

💡 The most interesting part is when these commands above are not recognized, the `Devstral` 
LLM is asked to create a custom OSM Overpass Turbo query for the command spoken by the user.
This custom query is then executed on the Overpass Turbo API. The resulting data is shown on
the map as pins.

A dynamic command can be for example: "Show me all pharamacies.". Basically you can ask
anything that fits into the five seconds speech boundary.

## Debugging 🐞

Console logs are included for your convenience.

## Security 🛡️

Note that this is a proof-of-concept and not ready for production. Especially the Mistral
API key is contained in the runtime environment which is not secure.

## Software Stack ⚙️

- Mistral TypeScript client: https://github.com/mistralai/client-ts
- Maplibre-gl-js: https://github.com/maplibre/maplibre-gl-js
- React-map-gl: https://github.com/visgl/react-map-gl
- Bun: https://bun.sh/

Code snippets have been taken from the Mistral and MapLibre documentation.

Note: This code base was partially generated with coding LLMs.

## Third-Party APIs 🔌

- Mistral (voxtral-mini-latest): https://docs.mistral.ai/capabilities/audio_transcription/offline_transcription
- Mistral (devstral-2512): https://docs.mistral.ai/models/devstral-2-25-12
- OpenFreeMap: https://openfreemap.org
- Nominatim: https://nominatim.org
- Overpass: https://wiki.openstreetmap.org/wiki/Overpass_API

## Prior Art 🏛️

The project [SpeechMap](https://github.com/do-me/speechmap) from Dominik Weckmüller had the idea and implemented it five years ago. I have only seen the project after developing `maplibre-voice`. He used a different stack and does not have dynamic queries like `maplibre-voice` with the Devstral model that dynamically generates OSM Overpass queries.

## License ⚖️

MIT License