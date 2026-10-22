# Hospitable Listing Widgets builder

The builder is part of [Hospitable Listing Widgets](https://github.com/agmadt/hospitable-widgets), a free, open-source way to show your [Hospitable](https://hospitable.com) listings on your own website. It's the website where you design your widgets and copy them into Wix, Squarespace, WordPress, Webflow or any other site. Open it at [hospitable-widget.adhityoagam.com](https://hospitable-widget.adhityoagam.com/).

<p align="center"><img src="docs/builder.jpg" width="820" alt="The builder: the four steps Design, Deploy, Connect and Copy at the top, the 16 widget types on the left, and a photo gallery previewed with sample data on the right"></p>

## How it fits with the kit

The project has two parts, each with its own code on GitHub:

| Part | What it does | Where it runs |
| --- | --- | --- |
| [hospitable-widgets](https://github.com/agmadt/hospitable-widgets), the kit | Your Worker, which keeps your listing data up to date, and the widget code your website loads | Your Worker runs in your own Cloudflare account. The widget code comes from jsDelivr. |
| hospitable-widget-builder, this builder | The website where you design a widget and copy its snippet | At [hospitable-widget.adhityoagam.com](https://hospitable-widget.adhityoagam.com/), or as [your own copy](#run-your-own-builder) |

You use the builder while you set things up, and again whenever you want to change a widget. Your website never loads anything from it: each widget gets its code from jsDelivr and its data from your Worker.

The kit's README explains what it costs, how fresh the data is and what stays private.

## What you do in it

The builder takes you through four steps, shown at the top of the page.

1. Design. Pick one of the 16 widgets, such as a photo gallery, amenities, reviews or an availability calendar. Choose its colors, fonts and layout, or start from one of six ready-made styles. The font can follow your website's own font, or be any font from Google Fonts. The preview shows the widget on a desktop, a tablet or a phone, and on a light or a dark page. Until you connect your own listings, you design with sample data. If you know HTML, you can also edit the widget's code directly.
2. Deploy. The builder shows you how to create an access token in Hospitable, then sends you to Cloudflare's website. There you paste the token and set up your Worker: a small program in your own free Cloudflare account that keeps your listing data up to date.
3. Connect. Open your Worker's address and the builder connects to it. Pick one of your properties, and the preview switches to your real listing.
4. Copy. Copy the snippet, two lines of code, and paste it into your website. The builder shows where it goes on Wix, Squarespace, WordPress, Webflow and other sites, suggests a height for Wix embeds, and can open the widget on a test page first. To look closer, send the snippet to the [Embed Code Tester](https://webdevutility.com/embed-code-tester/): it runs the snippet and lists everything it loads and whether anything fails.

You can try every step before you have any account: in the Deploy or Connect step, click Use the demo Worker. It connects the builder to a Worker that runs on sample data.

To change a widget later, come back, adjust it and copy a new snippet to replace the old one. Changes you make to your listing in Hospitable reach your website on their own.

## Your token and your data

- The builder has no field for your Hospitable token. You paste the token on Cloudflare's own website, at `dash.cloudflare.com`.
- The builder has no server of its own. It runs in your browser, and to show your real listing it reads the same public information that your website will show.
- Your design is saved in your browser, on this device only. Another browser or computer starts with a fresh design, and clearing your browser's data for the site removes it.
- The builder has no tracking or analytics. To work, it loads its fonts from Google Fonts, the widget code from jsDelivr and the sample photos from Unsplash.
- The Embed Code Tester is a separate website, webdevutility.com, with analytics of its own, and opens only when you click its link. It runs your snippet in your browser. The snippet holds your Worker's address and your property's ID, which your website shows anyway, and never your token.
- All of the builder's code is in this repository, open for anyone to read. The kit's README has [a prompt you can paste into ChatGPT or Claude](https://github.com/agmadt/hospitable-widgets#is-it-safe): it has the AI read the code of both the kit and this builder, and tell you whether they're safe to use.

## Your own style

Matching your website usually takes no code at all. In the Design step you choose the colors, the fonts (your website's own font or any Google font), how rounded the corners are and whether the widget sits in a card. Under Advanced: edit the HTML you can change the widget's HTML and CSS too.

To get your website's look as a ready-made style, one click away like Lagoon or Midnight, ask an AI to add it. The ready-made styles all live in one file, [`src/lib/style.ts`](src/lib/style.ts), so the change is small. The AI can do one of two things with it:

- Open a pull request to this repository: a request to add your style to the public builder. If it's accepted, your style appears for everyone at hospitable-widget.adhityoagam.com.
- Put it in your own copy of the builder and deploy that copy, as described in [Run your own builder](#run-your-own-builder). The style is then yours alone, and you don't wait for anyone to accept it.

Use an AI assistant that can work on GitHub for you, such as Claude Code or OpenAI Codex. Copy the prompt below, and replace the website address and the style's name with your own.

```text
I'm a vacation rental host, not a programmer. I design my Hospitable
listing widgets with this builder:
https://github.com/agmadt/hospitable-widget-builder

I want my widgets to match the style of my website:
https://www.example.com

1. Open my website and work out its style: the main accent color, the
   text and background colors, the fonts for text and headings, and
   how rounded its buttons and boxes are.
2. Read the builder's code, starting with README.md, docs/developers.md
   and src/lib/style.ts. Add a ready-made style (a preset) named
   "My Villa" to the PRESETS list in src/lib/style.ts, using only the
   settings the other presets use.
3. Run npm install, npm test and npm run build, and fix anything that
   fails.
4. Open a pull request to agmadt/hospitable-widget-builder with this
   style, and say in it which colors and fonts you took from my site.

Before you create anything in my GitHub account, tell me what you're
about to do and wait for my OK. Explain each step in plain language.
```

To keep the style to yourself instead, replace step 4 with: `Put this style in my own copy (fork) of the builder on GitHub, then help me deploy that copy, as "Run your own builder" in README.md describes.`

If you're at home on GitHub, you can make the same change yourself: open `src/lib/style.ts`, click the pencil icon, add a line like the six that are already there and click Propose changes. GitHub makes the pull request for you.

Neither the AI nor the builder ever needs your Hospitable token. If an AI asks for it, don't give it.

## Run your own builder

The builder at hospitable-widget.adhityoagam.com is built from the code in this repository, and the people who make this project decide when it changes. If you'd rather not rely on a website someone else runs, you can run your own copy for free on Cloudflare Pages, in the same Cloudflare account as your Worker. Your copy:

- runs code that you, or your AI, have read, and only changes when you update it,
- makes the same snippets, so your widgets still get their code from jsDelivr and their data from your Worker,
- can have [styles of your own](#your-own-style).

An AI that can work on GitHub can set it up with you. Copy this prompt:

```text
I'm a vacation rental host, not a programmer. Please help me run my
own copy of this website on Cloudflare Pages:
https://github.com/agmadt/hospitable-widget-builder

1. Read README.md, docs/developers.md and the code in src/ first.
   Tell me in plain language what the builder does, and whether it
   sends my token or my data anywhere.
2. Make a copy (fork) of the repository in my GitHub account.
3. Walk me through creating a Cloudflare Pages project for my copy,
   with the build settings in the Hosting section of
   docs/developers.md.
4. When it's live, help me point my Worker at it: in the copy of
   hospitable-widgets that the Deploy to Cloudflare button made in my
   GitHub account, set BUILDER_URL in wrangler.jsonc to my builder's
   address.

Before you create or change anything in my GitHub or Cloudflare
account, tell me what you're about to do and wait for my OK.
```

Or do it by hand:

1. On GitHub, click Fork at the top of this page. GitHub makes a copy of the builder in your account.
2. In Cloudflare, under Workers & Pages, create a Pages project from your copy on GitHub. Set the build command to `npm run build` and the build output directory to `dist`, add an environment variable `NODE_VERSION` with the value `22`, and deploy.
3. Your builder gets an address that ends in `.pages.dev`. Open it, and in the Connect step paste your Worker's address.
4. If you'd like your Worker's own address to open your builder too, point your Worker at it. On GitHub, open the copy of hospitable-widgets that the Deploy to Cloudflare button made (it has the same name as your Worker), edit `wrangler.jsonc` and replace the address after `"BUILDER_URL"` with your builder's. Cloudflare updates your Worker by itself, and the kit's update button keeps your address.

To get the builder's improvements later, open your copy on GitHub and click Sync fork. Cloudflare then rebuilds your builder by itself. If GitHub reports a conflict, for example because you added a style, ask your AI to sync it for you.

## If something doesn't work

The kit's README has a table of common problems and their fixes: [If something goes wrong](https://github.com/agmadt/hospitable-widgets#if-something-goes-wrong). It covers, for example, a gallery that only shows the cover photo, a Worker address that won't open, and a token that Hospitable rejects.

---

Working on the builder itself? Read the [developer guide](docs/developers.md).

[MIT license](LICENSE). Not affiliated with or endorsed by Hospitable.
