import { colorDistance } from "../../lib/color";
import { pageHostLabel, urlTrail, withoutUserInfo } from "../../lib/url";
import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";
import { Animated, Pressable, StyleSheet, View, type ViewStyle } from "react-native";
import { useTheme } from "../ui/theme";
import { TOOLBAR_ROWS, toolbarTrailing, urlFieldOf, type ToolbarRow } from "../../lib/toolbarRow";
import { ToolbarRowContext } from "../ui/toolbarRowContext";
import { activate } from "../../state/tabs/actions";
import { openPanel as openWindowPanel, toggleSidebar } from "../../state/windows/actions";
import { cancelPanel } from "../../state/omnibox/barState";
import { useBrowser } from "../../state/browser/store";
import { QuietLightDots } from "../window/QuietLightDots";
import { useIsBookmarked, useSettings, useSidebarSide, useTab, useTabLayout, useTabLive, useTabsPlace, useTabsShown, useWindowFullScreen } from "../../state/browser/hooks";
import type { Tab } from "../../state/browser/types";
import { Button, ContextMenuArea, Divider, FadeLabel, ink, layout, monoFace, sidebarFont, sidebarPoints, drawnSymbol, space, Symbol, Text, useHover, WindowDragRegion, withAlpha } from "../ui";
import { type ToolbarGeometry } from "../window/geometry";
import { usePage, usePages, type PageState } from "../../state/tabs/pageState";
import { togglePopover } from "../../state/tabs/popoverDismiss";
import { useHistoryAvailability } from "../../state/tabs/navigation";
import { toggleBookmarkOfTab } from "../../state/bookmarks/actions";
import { useBookmarksShown } from "../../state/bookmarks/hooks";
import { copyPageUrl } from "../../state/site/selection";
import { closePane, openSplitPane, showSplitMenu } from "../../state/splits/actions";
import { splitViewAvailable } from "../../state/splits/splits";
import { useEasedColor, type ToolbarPalette } from "../ui/toolbarColors";
import { useSitePalette } from "./useSitePalette";
import { setToolbarExtensionsWidth } from "../../state/windows/layout";
import { SIDEBAR_FIELD } from "../sidebar/geometry";
import { FieldSiteButton, SidebarFieldFill } from "../sidebar/SidebarField";
import { showUrlBarMenu } from "../../state/omnibox/paste";
import { ToolbarExtensions, useToolbarExtensionsWidth } from "../extensions/ToolbarExtensions";
import { GlassFill, useGlass } from "../ui/Glass";
import { TranslateButton } from "../site/TranslateControls";
import { ReaderButton, useReaderButtonShown } from "../site/ReaderControls";
import { ZoomIndicator } from "../site/ZoomControls";
import { NAV_HINTS, useShortcutHint, useShortcutHints, withShortcut } from "../../state/commands/commandShortcuts";
import { curve } from "../ui/motion";
import { FieldLoadFill } from "./FieldLoadFill";
import { fieldButtonsShown, sidebarFieldButtons } from "./fieldButtons";
import { useFieldExtensionsHeld } from "../../state/extensions/store";
import { noteSiteControls } from "../../state/telemetry/usage";
import { HistoryButton, ReloadButton } from "./NavButtons";
import { LoadingPill, ProgressBar } from "./ProgressBar";
import { FIELD_LOAD, TOOLBAR_MOTION } from "./tokens";
import { useToolbarRow } from "./useToolbarRow";
import { useStableHandler } from "./useStableHandler";
import { PAGE_IDENTITY_TAG } from "../../state/tabs/tabReveal";
import { DeveloperToolsButtons } from "./DeveloperToolsButtons";
import { useDeveloperMode } from "../../state/site/developerMode";

type ToolbarTab = Pick<Tab, "id" | "url" | "title" | "windowId" | "zoom">;
const toolbarTab = (t: Tab | undefined): ToolbarTab | undefined =>
  t && { id: t.id, url: t.url, title: isWebUrl(t.url) ? "" : t.title, windowId: t.windowId, zoom: t.zoom };
const isWebUrl = (url: string) => /^https?:/i.test(url);
export const useToolbarTab = (tabId: string | undefined) => useTab(tabId, useShallow(toolbarTab));

export const urlFieldRight = (inSplit: boolean, extensionsWidth: number, row: ToolbarRow, cardRadius: number) =>
  toolbarTrailing(row, { pinnedWidth: extensionsWidth, split: inSplit, cardRadius }).fieldRight;
const LOCK = { left: 7, width: 18, gap: space.xs } as const;
const SIDEBAR_TEXT_GAP = 6;
const SIDEBAR_TEXT_ALONE = space.ml;
export const urlTextLeft = (insecure: boolean) => (insecure ? LOCK.left + LOCK.width + LOCK.gap : 8);
export const insecureLevel = (p: PageState) =>
  p.security && (p.security.level === "insecure" || p.security.level === "certificateError") ? p.security.level : null;

function useTabsToggleIcon(windowId: string) {
  const place = useTabsPlace(windowId);
  return place === "top" ? "rectangle.topthird.inset.filled" : place === "right" ? "sidebar.right" : "sidebar.left";
}

const TOOLBAR_HINTS = ["toggleSidebar", "openSplitPane", ...NAV_HINTS] as const;

export const Toolbar = memo(function Toolbar({
  tabId,
  geometry,
  windowId,
  inSplit,
  focused,
  bare,
  loadFill = true,
}: {
  tabId: string;
  geometry: ToolbarGeometry;
  windowId: string;
  inSplit: boolean;
  focused: boolean;
  bare?: boolean;
  loadFill?: boolean;
}) {
  const hints = useShortcutHints(TOOLBAR_HINTS);
  const tabsIcon = useTabsToggleIcon(windowId);
  const tabsShown = useTabsShown(windowId);
  const tab = useToolbarTab(tabId);
  const isLoading = useTabLive(tabId, (l) => l.isLoading);
  const palette = useSitePalette(tabId);
  const band = useEasedColor(bare ? null : palette.background);
  const history = useHistoryAvailability(tabId);
  const row = useToolbarRow();
  const extensionsWidth = useToolbarExtensionsWidth(windowId, Infinity);
  useEffect(() => setToolbarExtensionsWidth(windowId, extensionsWidth), [windowId, extensionsWidth]);
  const dim = useRef(new Animated.Value(focused ? 1 : 0.5)).current;
  const dimmedFor = useRef(focused);
  useEffect(() => {
    if (dimmedFor.current === focused) return;
    dimmedFor.current = focused;
    Animated.timing(dim, { toValue: focused ? 1 : 0.5, duration: TOOLBAR_MOTION.dim, easing: curve.enter, useNativeDriver: true }).start();
  }, [focused]);
  const focus = useStableHandler(() => {
    if (!focused) activate(tabId);
  });
  const toggleTabs = useCallback(() => toggleSidebar(windowId), [windowId]);
  const splitMenu = useCallback(() => showSplitMenu(tabId), [tabId]);
  const closeThisPane = useCallback(() => closePane(tabId), [tabId]);
  // (fork) Zen-style toolbar: traffic lights (when the sidebar is hidden) and the sidebar button on the left,
  // back / forward / reload on the right, just before the extensions
  const sidebarLayout = useTabLayout(windowId) === "sidebar";
  const sidebarOnLeft = useSidebarSide(windowId) === "left";
  const fullScreen = useWindowFullScreen(windowId);
  const lightsInToolbar = sidebarLayout && sidebarOnLeft && !tabsShown && !inSplit && !fullScreen;
  // One pitch for everything on the right: status icons, back, forward, reload, then (in a split pane) the split
  // and close buttons. Each sits `navStep` from the next, centre to centre, with 4 pt between hover plates.
  const navStep = row.button + 4;
  const edge = 8; // from the pane's right edge to the last button
  const right = (inSplit ? edge + 2 * navStep + 4 : edge + 4) + extensionsWidth;
  const statusRight = right - 4 + 3 * navStep + row.button / 2 - space.xs - row.fieldButton / 2;
  const leftStart = lightsInToolbar ? layout.trafficLightsWidth : 8;
  const urlLeft = geometry.sidebarButton !== null ? leftStart + row.button + 4 : leftStart;
  const at = useMemo(() => {
    const top = Math.round(row.center - row.button / 2); // (fork) whole points, so buttons don't blur or drop a pixel on low-DPI screens
    const place = (center: number | null) => ({ position: "absolute" as const, top, left: (center ?? 0) - row.button / 2 });
    const hit = { width: row.button, height: row.button, plateX: 0, plateY: 0, box: row.button, radius: row.buttonRadius };
    const nav = (fromRight: number) => ({ style: { position: "absolute" as const, top, right: right - 4 + fromRight * navStep }, hit });
    return { top, sidebarButton: place(leftStart + row.button / 2), back: nav(2), forward: nav(1), reload: nav(0) };
  }, [row, right, navStep, leftStart]);
  // (fork) quiet traffic lights (QuietLightDots) while they sit in the toolbar
  const lightInk = palette.text.startsWith(ink.white);
  const bar = useRef<View>(null);
  const urlStyle = useMemo(() => ({ position: "absolute" as const, left: urlLeft, right: statusRight, top: urlFieldOf(row).top }), [urlLeft, statusRight, row]);
  if (!tab) return <View style={{ height: row.height }} />;

  return (
    <View ref={bar} style={{ height: row.height }}>
      {!bare && <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: band }]} />}
      <WindowDragRegion style={StyleSheet.absoluteFill} />
      <QuietLightDots windowId={windowId} owner={`toolbar:${tabId}`} on={lightsInToolbar} color={palette.text} lightInk={lightInk} refresh={row} />
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: dim }]} pointerEvents="box-none">
        {geometry.sidebarButton !== null && (
          <Button variant="icon" toolbar
            style={at.sidebarButton}
            palette={palette}
            icon={tabsIcon}
            look="row"
            onPress={toggleTabs}
            tooltip={withShortcut(tabsShown ? "Hide Tabs" : "Show Tabs", hints.toggleSidebar)}
          />
        )}
        <HistoryButton place={at.back} tabId={tab.id} windowId={tab.windowId} direction={-1} disabled={!history.back} palette={palette} onFocus={focus} closesTab={history.backCloses} historyHint={hints.back} />
        <HistoryButton place={at.forward} tabId={tab.id} windowId={tab.windowId} direction={1} disabled={!history.forward} palette={palette} onFocus={focus} historyHint={hints.forward} />
        <ReloadButton place={at.reload} tab={tab} loading={isLoading} palette={palette} onFocus={focus} reloadHint={hints.reload} />
        <ToolbarExtensions tabId={tab.id} windowId={windowId} palette={palette} top={Math.round(row.center - row.extensionButton / 2)} right={inSplit ? edge + 2 * navStep : edge} />
        <View nativeID={PAGE_IDENTITY_TAG} collapsable={false} pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          {tab.url ? (
            <ToolbarUrlField tab={tab} palette={palette} windowId={windowId} inSplit={inSplit} loadFill={loadFill} onFocus={focus} style={urlStyle} splitHint={hints.openSplitPane} />
          ) : null}
        </View>
        {inSplit && (
          <View style={{ position: "absolute", top: at.top, right: edge, flexDirection: "row", gap: navStep - row.button }}>
            <Button variant="icon" toolbar palette={palette} icon="rectangle.split.2x1" look="row" onPress={splitMenu} tooltip="Split View" />
            <Button variant="icon" toolbar palette={palette} icon="xmark" look="row" weight="medium" onPress={closeThisPane} tooltip="Close Pane" />
          </View>
        )}
      </Animated.View>

      {/* (fork) the bottom hairline is a full point in the page's ink, so it shows on every site tint */}
      {tab.url && !bare ? <View pointerEvents="none" style={[BOTTOM_LINE, { height: 1, backgroundColor: palette.text, opacity: HAIRLINE_OPACITY }]} /> : null}
      {/* (fork) the loading bar is a pill in the domain's place (ToolbarUrlField), not a line on the bottom edge */}
    </View>
  );
});

const BOTTOM_LINE = { position: "absolute", left: 0, right: 0, bottom: 0 } as const;
const HAIRLINE_OPACITY = 0.12;

export function ToolbarBackdrop({ tabId }: { tabId: string }) {
  const url = useTab(tabId, (t) => t?.url ?? "");
  const palette = useSitePalette(tabId);
  const band = useEasedColor(palette.background);
  const row = useToolbarRow();
  return (
    <View pointerEvents="none" style={{ height: row.height }}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: band }]} />
      {/* (fork) the same full-point hairline as the pane toolbar's */}
      {url ? <View style={[BOTTOM_LINE, { height: 1, backgroundColor: palette.text, opacity: HAIRLINE_OPACITY }]} /> : null}
    </View>
  );
}

function useUrlField(tab: ToolbarTab, windowId: string, onFocus: () => void) {
  const developerMode = useDeveloperMode(tab.url);
  const showFullUrl = useSettings((s) => s.showFullUrl);
  const insecure = usePage(tab.id, insecureLevel);
  const popover = usePages((p) => p.popover[tab.id] ?? null);
  const { hovered: pointerOver, hoverProps } = useHover();
  const hovered = pointerOver || popover === "siteControls";
  const buttonsShown = fieldButtonsShown(useSettings((s) => s.addressBarButtons), hovered);
  const openPanel = useStableHandler(() => {
    onFocus();
    openWindowPanel(windowId, tab.url, undefined, "centred"); // (fork) same place Cmd+L opens it
  });
  const toggleSiteControls = useStableHandler(() => {
    onFocus();
    togglePopover(tab.id, "siteControls");
  });
  return { insecure, popover, hovered, buttonsShown, developerMode, hoverProps, openPanel, toggleSiteControls, host: pageHostLabel(tab.url), trail: urlTrail(tab.url, tab.title, { hovered, showFullUrl }) };
}

const loadFillColor = (palette: ToolbarPalette, accent: string) =>
  palette.background && colorDistance(accent, palette.background) < FIELD_LOAD.accentApartFromBand ? palette.text : accent;

type UrlFieldProps = { tab: ToolbarTab; palette: ToolbarPalette; windowId: string; onFocus: () => void };

export const ToolbarUrlField = memo(function ToolbarUrlField({ tab, palette, windowId, inSplit, loadFill, onFocus, style, splitHint }: UrlFieldProps & { inSplit: boolean; loadFill: boolean; style: ViewStyle; splitHint: string | undefined }) {
  const theme = useTheme();
  const row = useToolbarRow();
  const field = useUrlField(tab, windowId, onFocus);
  const { insecure, hovered, buttonsShown, popover, toggleSiteControls } = field;
  const openSplit = useStableHandler(() => openSplitPane(windowId, { anchorTabId: tab.id }));
  const glass = useGlass();
  // (fork) centre the domain on the toolbar's full width, not on the field: pad whichever side has less
  // around the text (nav buttons on the left; the field's own buttons and the extensions on the right)
  const [buttonsWidth, setButtonsWidth] = useState(0);
  // (fork) at rest the domain is the page ink let through the toolbar's tint (a deeper or paler shade of it); full ink on hover
  const domain = useHover();
  // (fork) the domain toggles the command bar: a click while it is open closes it, and the pill stays while it is open.
  // Clicking the domain counts as a click outside the bar, which may close it before the press lands, so a press
  // just after it closed counts as the closing click too.
  const barOpen = useBrowser((s) => s.windowUi[windowId]?.panel.open ?? false);
  const barClosedAt = useRef(0);
  useEffect(() => {
    if (!barOpen) barClosedAt.current = Date.now();
  }, [barOpen]);
  const pressDomain = () => {
    if (useBrowser.getState().windowUi[windowId]?.panel.open) return cancelPanel(windowId);
    if (Date.now() - barClosedAt.current < 400) return;
    field.openPanel();
  };
  const domainLit = domain.hovered || barOpen;
  const textLeft = insecure ? LOCK.gap : urlTextLeft(false);
  const leftInset = (typeof style.left === "number" ? style.left : 0) + (insecure ? LOCK.left + LOCK.width : 0) + textLeft;
  const rightInset = (typeof style.right === "number" ? style.right : 0) + buttonsWidth;
  const balance = leftInset - rightInset;
  // (fork) while the tab loads, a small pill takes the domain's place; they cross-fade
  const loading = useTabLive(tab.id, (l) => l.isLoading);
  const swap = useRef(new Animated.Value(loading ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(swap, { toValue: loading ? 1 : 0, duration: 200, easing: curve.enter, useNativeDriver: true }).start();
  }, [loading]);

  return (
    <View pointerEvents="box-none" style={[style, { flexDirection: "row", alignItems: "center", height: row.field, borderRadius: row.fieldRadius }]}>
      {/* (fork) no container behind the address: it takes the toolbar's own colour, at rest and on hover */}
      {insecure && (
        <Pressable onPress={toggleSiteControls} style={{ paddingLeft: LOCK.left }} tooltip="Connection is not secure">
          {drawnSymbol({
            name: "lock.open.trianglebadge.exclamationmark.fill",
            size: 12,
            color: insecure === "certificateError" ? theme.destructive : palette.secondary,
            style: { width: LOCK.width, height: row.field },
          })}
        </Pressable>
      )}
      {/* (fork) no address field: just the domain as plain text. Clicking the text opens the command bar (as Cmd+L does);
          the empty toolbar either side of it still drags the window. */}
      <View pointerEvents="box-none" style={{ flex: 1, height: row.field, justifyContent: "center", paddingLeft: textLeft + Math.max(0, -balance), paddingRight: Math.max(0, balance) }}>
        <View pointerEvents="box-none" style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
          <Animated.View {...domain.hoverProps} style={{ flexShrink: 1, opacity: swap.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }}>
            <Pressable onPress={pressDomain} style={{ flexShrink: 1, height: row.field, justifyContent: "center" }}>
              {/* (fork) on hover the domain sits in a soft rounded pill, like a button */}
              <View style={{ flexShrink: 1, height: DOMAIN_PILL.height, justifyContent: "center", paddingHorizontal: DOMAIN_PILL.padX, borderRadius: DOMAIN_PILL.radius, backgroundColor: domainLit ? withAlpha(palette.text, DOMAIN_PILL.fill) : ink.clear }}>
                <Text numberOfLines={1} ellipsizeMode="head" weight="medium" color={palette.text} ardiaCentersCapitals style={[HOST_FULL, { opacity: domainLit ? 1 : DOMAIN_REST }]}>
                  {field.host}
                </Text>
              </View>
            </Pressable>
          </Animated.View>
          <Animated.View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center", opacity: swap }}>
            {loading && <LoadingPill key={tab.id} color={palette.text} />}
          </Animated.View>
        </View>
      </View>
      <View onLayout={(e) => setButtonsWidth(e.nativeEvent.layout.width)}>
        <FieldButtons tab={tab} palette={palette} onFocus={onFocus} popover={popover} toggleSiteControls={toggleSiteControls}>
          {null}
        </FieldButtons>
      </View>
    </View>
  );
});

export const SidebarUrlField = memo(function SidebarUrlField({ tab, palette, windowId, onFocus, height, accessory }: UrlFieldProps & { height: number; accessory: ReactNode }) {
  const theme = useTheme();
  const field = useUrlField(tab, windowId, onFocus);
  const { insecure, hovered, popover, toggleSiteControls } = field;
  const extensionsHeld = useFieldExtensionsHeld(windowId);
  const shown = sidebarFieldButtons({ mode: useSettings((s) => s.addressBarButtons), hovered, insecure: !!insecure, extensionsHeld });
  const openSiteControls = useStableHandler(() => {
    if (popover !== "siteControls") noteSiteControls("sidebarField");
    toggleSiteControls();
  });

  return (
    <View {...field.hoverProps} style={{ flexDirection: "row", alignItems: "center", height, borderRadius: SIDEBAR_FIELD.radius }}>
      <SidebarFieldFill hovered={hovered} />
      <FieldLoadFill tabId={tab.id} color={loadFillColor(palette, theme.accent)} height={height} radius={SIDEBAR_FIELD.radius} />
      {shown.leading && (
        <FieldSiteButton
          icon={insecure ? "lock.open.trianglebadge.exclamationmark.fill" : "slider.horizontal.3"}
          color={insecure === "certificateError" ? theme.destructive : undefined}
          tooltip={insecure ? "Connection is not secure" : "Site Controls"}
          active={popover === "siteControls"}
          palette={palette}
          onPress={openSiteControls}
        />
      )}
      <ContextMenuArea style={{ flex: 1 }} onContextMenu={() => void showUrlBarMenu(tab)}>
        <Pressable onPress={field.openPanel} style={{ flex: 1, height, justifyContent: "center", paddingLeft: shown.leading ? SIDEBAR_TEXT_GAP : SIDEBAR_TEXT_ALONE }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text numberOfLines={1} ellipsizeMode="head" weight="medium" color={palette.text} ardiaCentersCapitals style={SHRINK}>
              {field.host}
            </Text>
            <FadeLabel text={field.trail} fontSize={sidebarFont.body.fontSize} color={palette.secondary} fadeWidth={14} style={{ flex: 1, height: sidebarPoints(18), marginLeft: -space.xxs }} />
          </View>
        </Pressable>
      </ContextMenuArea>
      <ToolbarRowContext.Provider value={TOOLBAR_ROWS.regular}>
        <FieldButtons tab={tab} palette={palette} onFocus={onFocus} popover={popover} toggleSiteControls={openSiteControls} accessory={shown.extensions ? accessory : null} quiet={!shown.page}>
          {shown.page && <PageButton tab={tab} palette={palette} windowId={windowId} />}
          {shown.siteControls && <Button variant="icon" toolbar palette={palette} icon="slider.horizontal.3" look="field" onPress={openSiteControls} active={popover === "siteControls"} tooltip="Site Controls" />}
        </FieldButtons>
      </ToolbarRowContext.Provider>
    </View>
  );
});

const DOMAIN_REST = 0.5;
const DOMAIN_PILL = { height: 20, radius: 6, padX: 6, fill: 0.12 } as const;
const HOST_FULL = { flexShrink: 0, maxWidth: "100%" } as const;
const SHRINK = { flexShrink: 1 } as const;

type PageButtonProps = { tab: ToolbarTab; palette: ToolbarPalette; windowId: string };

function PageButton(props: PageButtonProps) {
  return useBookmarksShown() ? <BookmarkButton {...props} /> : <CopyUrlButton {...props} />;
}

function CopyUrlButton({ tab, palette }: PageButtonProps) {
  const copyHint = useShortcutHint("copyUrl");
  return <Button variant="icon" toolbar palette={palette} icon="link" look="field" onPress={() => void copyPageUrl(tab.id)} tooltip={withShortcut("Copy URL", copyHint)} />;
}

function BookmarkButton({ tab, palette, windowId }: PageButtonProps) {
  const bookmarkHint = useShortcutHint("bookmarkPage");
  const bookmarked = useIsBookmarked(tab.url);
  return (
    <Button variant="icon" toolbar palette={palette} icon={bookmarked ? "bookmark.fill" : "bookmark"} look="field" onPress={() => toggleBookmarkOfTab(windowId, tab.id)} tooltip={bookmarked ? "Remove Bookmark" : withShortcut("Bookmark This Page", bookmarkHint)} />
  );
}

function FieldButtons({
  tab,
  palette,
  onFocus,
  popover,
  toggleSiteControls,
  accessory,
  quiet = false,
  children,
}: {
  tab: ToolbarTab;
  palette: ToolbarPalette;
  onFocus: () => void;
  popover: string | null;
  toggleSiteControls: () => void;
  accessory?: ReactNode;
  quiet?: boolean;
  children: ReactNode;
}) {
  const popups = usePage(tab.id, (p) => p.popups.length);
  const capture = usePage(tab.id, (p) => p.mediaAccess);
  const reader = useReaderButtonShown(tab.id, quiet);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingRight: space.xs }}>
      {children}
      {capture && <CaptureIndicator camera={capture.camera} microphone={capture.microphone} screen={capture.screen} onPress={toggleSiteControls} />}
      {reader && <ReaderButton tabId={tab.id} palette={palette} onFocus={onFocus} quiet={quiet} />}
      <TranslateButton tabId={tab.id} palette={palette} onFocus={onFocus} quiet={quiet} />
      <ZoomIndicator tabId={tab.id} zoom={tab.zoom} palette={palette} onFocus={onFocus} quiet={quiet} />
      {popups > 0 && (
        <Button variant="icon" toolbar
          palette={palette}
          icon="macwindow.badge.plus"
          look="field"
          onPress={() => {
            onFocus();
            togglePopover(tab.id, "popups");
          }}
          active={popover === "popups"}
          tooltip="Pop-ups blocked on this page"
        />
      )}
      {accessory}
    </View>
  );
}

function CaptureIndicator({ camera, microphone, screen, onPress }: { camera: boolean; microphone: boolean; screen: boolean; onPress: () => void }) {
  const theme = useTheme();
  const icon = screen ? "rectangle.inset.filled.on.rectangle" : camera ? "video.fill" : "mic.fill";
  const what = [camera && "camera", microphone && "microphone", screen && "screen"].filter(Boolean).join(" and ");
  return <Button variant="icon" icon={icon} look="field" color={theme.destructive} onPress={onPress} tooltip={`This page is using your ${what}`} />;
}

