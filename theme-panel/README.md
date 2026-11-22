# Theme panel

A column of theme cards docked on the right side of the Claude desktop app. Each card is a small
picture of the theme's scene with its name under it; click the picture and that theme goes on at once,
backdrop and colours together. The choice is kept, so new sessions start on the same theme.
The cards come four to a page; the ▲ and ▼ arrows at the top turn the page.


Themes: Rainy Window, Cloud Sea, Deep Reef, Gas Station, Hill Village, Lavender Slope, Mirror Lake,
Moon Keep, Side Street, Sunfield, Harbor, Tide Line, Sunbeam Wood, Snowfall Ridge, Rainy Studio and Low Orbit.
The BackdropKit themes show their scenes as they ship, whole,
and every theme stays on its night look whatever the time. Gas Station's
price board still shows this chat's tokens, context and weekly limit.

The Cyberpunk HUD (if installed) recolours itself to match whichever theme the panel puts on;
under Rainy Window it keeps its original neon colours.

## Commands

- `/theme-panel` or `/theme-panel on`: open the panel.
- `/theme-panel off`: close it, in new sessions too.
- `/theme-panel <name>`: switch theme by name, for example `/theme-panel moon keep`.

Turn off other theme plugins (rainy-window, the backdropkit-* themes) while this one is on, or
they will set their own theme when a session starts.

## Credits

- Rainy Window's scene and Clawd are from the rainy-window plugin by Ishu Agrawal, MIT licence
  (`hooks/rainy/LICENSE`).
- The other fifteen scenes are from BackdropKit by winchxyz, MIT licence
  (`hooks/kit/LICENSE` and `hooks/sunfield/LICENSE`).

In the desktop app a small 🌄 button sits in the prompt footer, beside the model picker:
click it to open or close the panel. It sends nothing to the chat, so a running turn carries on.
