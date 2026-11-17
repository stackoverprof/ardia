# Bro: what this fork changes

Bro is Erbin's fork of Ardia (`ardia-browser/ardia`), on branch `erbin`. This file is the list of everything the
fork changes on purpose. When Ardia is merged in, every item here must still be true afterwards. Fork-only code is
marked with a `(fork)` comment, and `scripts/bro/check-tweaks.sh` checks the markers are still in place.

Update with `scripts/bro/update.sh`. If a merge conflicts with one of these, keep the tweak and adapt it to the new
upstream code. Never drop one to make a merge go through; ask Erbin instead.

## Identity and build

- **Named Bro**, with its own icon: dark dots forming a sphere on a white tile (`AppIcon.icon`, `Info.plist`).
  The Xcode product, the executable and the `ardia` command keep the name Ardia.
- **Everything shown says Bro.** Upstream's text says "Ardia" in hundreds of places; it is swapped where text is
  shown, not edited line by line: `lib/brand.ts` (used by `ui/Text`, button tooltips, field placeholders, dialogs)
  and `BroName` in `MainMenu.swift` (every menu, as it opens). "Little Ardia" reads "Little Bro". Credit and licence
  lines are never rewritten, and About opens with "Bro is a personal fork of Ardia".
- **Own app id and signing:** `is.erbin.ardia`, team `B39983B5VG` (`project.pbxproj`). Data lives in
  `~/Library/Application Support/is.erbin.ardia`.
- **No auto-update:** `SUFeedURL` is empty and `SUEnableAutomaticChecks` is false, because the official feed would
  replace Bro with stock Ardia. Updates come from merging upstream here.
- **Builds with Xcode 26:** upstream builds with Xcode 27. Patched: `preferredImageVisibility` removed in
  `MenusModule.swift` and `SharePicker.swift`; one expression spelled out in `ThemeGradient.swift`. Drop these once
  this Mac has Xcode 27.

## Toolbar

- Back, forward and reload sit on the **right**, before the extensions, 4 pt between their hover plates.
- **No address field.** Only the domain shows, centred on the toolbar's full width, with no container behind it.
  At rest it is a shade of the toolbar's tint (50%); on hover it is full ink. Clicking it opens the command bar.
- **Loading pill.** While a page loads, a small 40 x 4 pill (a brighter bar that stretches in from the left and leaves on the right, on a loop) takes the domain's place (they cross-fade), as in Zen. No hairline along the toolbar's bottom edge.
  The hover-only field buttons (bookmark, copy link, split, site controls) are gone; status icons stay.
- **Traffic lights at the toolbar's left** when the sidebar is hidden. At rest they are quiet dots in the page's
  ink, drawn by the toolbar on the real buttons' frames; hovering the corner shows the real coloured lights.

## Command bar

- Cmd+L always opens it **in the middle of the window**, on a wide soft shadow. No blur or dimming behind it.
- **Cmd+L again closes it.**

## Sidebar

- When it slides in over the page it shows **no traffic lights** and no header row; the pinned tiles start as far
  from the top as from the sides. **Nothing sits above the pinned tiles.**
- The **downloads button is in the footer**, at the far left, before the profile name.
- The sidebar keeps a **darker ground** than the window frame, docked or sliding.
- The **profile name is in the footer**, at the left, with the profile dots at the right; evenly padded.

## Window frame

- A thinner, **lighter** wash over the blurred desktop (white wash in dark mode), so the frame reads as see-through.

## Agent mode

- **Human / Agent switch** at the very bottom of the sidebar. Agent mode is the agents' profile (the one named Claude, or `agentProfileId`); Human mode goes back to the last human profile (`state/profiles/agentMode.ts`, `components/profiles/AgentModeSwitch.tsx`).
- **Each mode keeps its own sidebar side and auto-hide** (`agentSidebarSide`, `agentAutoHideTabs`, `human…`), swapped into the live settings when a window crosses modes (`switchProfile` in `state/windows/windows.ts`). Agent mode starts with the sidebar on the right, not auto-hiding. These settings are left out of the config file, so an agent can't change them.
- **Caution-tape stripes on the toolbar** in Agent mode, the page's ink at 7% over the site's tint (`HazardStripes.tsx`).
- **Stronger toolbar hairline:** 1 pt in the page's ink at 12%, instead of a hairline-width divider that vanishes on low-DPI screens.

## The ardia command

- **Control pill on the driven tab only.** "Claude Code is controlling Bro" shows only on the tab an `ardia browse` session drives, not on every tab in every profile. The CLI tells Bro which page it drives after each command (`using`, in `browse/state.py` and `control.py`); Bro maps it to a tab (`controlSocket.ts`) and the pill checks it (`CliControlPill.tsx`).
- **Sleeping tabs wake on their own.** Driving a tab Bro keeps asleep (`ardia browse tab <tab-id>` on a tab not shown since launch, or put to sleep) wakes it in the background and waits for its page, instead of failing with `tab_asleep` and needing a click (`wake_app_tab` in `browse/tabs.py`).
- The ardia command itself is upstream's release download, so `scripts/bro/cli-patch.sh` copies the fork's CLI files over it. `install.sh` runs it; re-run it after the CLI updates.
