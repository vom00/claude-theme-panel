# Theme panel and HUD

Two mods for Claude Code. The Theme panel puts a column of theme cards on the right side of the chat, and clicking a card switches the background scene and colours. The Cyberpunk HUD sits above the prompt and shows how full the context is, your plan limits, the cost so far and any agents that are running. When you change theme, the HUD picks up the new colours.

## Install

```
/plugin install theme-panel --marketplace vom00/claude-theme-panel
/plugin install cyberpunk-hud --marketplace vom00/claude-theme-panel
```

Then run `/reload-plugins` or start a new session.

## Theme panel

There are 16 themes: Rainy Window, Cloud Sea, Deep Reef, Gas Station, Hill Village, Lavender Slope, Mirror Lake, Moon Keep, Side Street, Sunfield, Harbor, Tide Line, Sunbeam Wood, Snowfall Ridge, Rainy Studio and Low Orbit. Each one starts on its night version and stays there at any hour until you pick another time of day on its card. The panel shows four cards at a time; use the arrows at the top to page through them. Your pick carries over to new sessions.

In the desktop app there's a 👒 button in the prompt footer, left of the model name. It opens and closes the panel without sending anything to the chat, so a reply that's running keeps going.

You can also use the command:

- `/theme-panel` opens the panel, `/theme-panel off` closes it.
- `/theme-panel moon keep` switches to a theme by name.
- `/theme-panel harbor day` (or `sunset`, `night`) puts a theme on at that time of day. The ☀️ 🌇 🌙 buttons in the top-right corner of each card do the same, and each theme keeps the time you last picked. Deep Reef, Moon Keep and Low Orbit have a single look, so they have no buttons; a few themes have only two of the three.
- `/theme-panel blur off` turns off the frosted blur behind messages, and `/theme-panel blur on` brings it back. The **Blur** switch at the bottom of the panel does the same.

On Gas Station, the price board in the scene shows this chat's token count, context use and weekly limit.

## HUD

A purple, scanlined readout above the prompt with a portrait, the theme card, the context bar, the 5-hour and weekly limits with their reset times, the session cost and the active agents. It reads the scene name from each theme change, so it matches whichever theme the panel has on.

Press the round minus button at the end of its top rail to shrink it to a slim strip with the HUD's rune, your context and plan limits; click anywhere on the strip (or its round maximize button) to bring the full HUD back. It stays minimized in new sessions until you bring it back (`/hud on` works too).

## Credits

Fifteen of the sixteen scenes are from [BackdropKit](https://winchxyz.github.io/backdropkit/) by winchxyz, a free, MIT-licensed set of animated pixel-art themes ([source](https://github.com/winchxyz/backdropkit)). You can download and install each one on its own from that page.

Rainy Window's scene is from the rainy-window plugin by Ishu Agrawal (https://github.com/ishuagrawal/claude-code-themes), under the MIT licence in `theme-panel/hooks/rainy/LICENSE`.

The Cyberpunk HUD's console above the prompt, with its portrait, gauges and plan limits, takes its idea from [Interlinked](https://github.com/codedcasanova/interlinked-theme) by codedcasanova, a retro-future noir theme for the Claude desktop app (MIT).
