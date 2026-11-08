# Chess Intelligence on the RBKC website

The Chess Intelligence page adds two free features to the static GitHub Pages site:

1. Public Chess.com and Lichess profile, rating and recent game lookups.
2. A coaching handoff that prepares a prompt with the selected game's PGN for the visitor to paste into their own ChatGPT chat.

## Privacy and costs

The page asks only for a public platform username. It does not ask for chess platform passwords, store profiles or games, or send game data to an AI service. A visitor chooses when to copy the game prompt and submit it to ChatGPT. Their use of ChatGPT is governed by their own account and plan.

The page makes read-only requests to Chess.com and Lichess public APIs from the visitor's browser. Requests may be limited by those platforms. There is no paid API or hosted backend in this version.

## Local preview

Open this repository's folder in an editor and serve it as a static site. Do not open the HTML file as `file://`, because browsers may block its public API requests from that origin.

## Later paid coach

Automated AI analysis for all website visitors will need a server-side service and an AI provider account. Keep any provider key in the backend host's secret settings, never in JavaScript or this repository. Add user consent, usage limits and payment handling before enabling paid access. GitHub Pages cannot run the Python MCP server itself.
