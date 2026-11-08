# Chess Intelligence on the RBKC website

The Chess Intelligence page lets visitors open a public Lichess study in an embedded viewer, switch chapters, and export its PGN into a coaching prompt they can paste into their own ChatGPT chat. The supplied RBKC study link is preloaded; visitors can paste another Lichess study URL or an 8-character study ID.

## Privacy and costs

The page requests only public Lichess study data. It does not ask for Lichess passwords, store studies, or send study data to an AI service. A visitor chooses when to copy the PGN and submit it to ChatGPT. Their use of ChatGPT is governed by their own account and plan.

The page opens the Lichess study embed and makes a read-only request to the Lichess study PGN export endpoint from the visitor's browser. Private studies are unavailable without authentication. Requests may be limited by Lichess. There is no paid API or hosted backend in this version.

## Local preview

Open this repository's folder in an editor and serve it as a static site. Do not open the HTML file as `file://`, because browsers may block cross-origin study export requests from that origin.

## Later paid coach

Automated AI analysis for all website visitors will need a server-side service and an AI provider account. Keep any provider key in the backend host's secret settings, never in JavaScript or this repository. Add user consent, usage limits and payment handling before enabling paid access. GitHub Pages cannot run the Python MCP server itself.
