/**
 * Tray card (Card Patterns, option C): a tinted tray carries the label and the
 * card's actions; the number, chart or table sits on a panel inside it.
 *
 * Light: grey tray, white panel. Dark: three even steps up from the page —
 * page (0.145) → tray (0.19) → panel (0.245) — so the content is the brightest
 * layer and the tray sits between it and the background. (Theme tokens don't
 * offer that middle step: --card is 0.205 and --muted 0.269.)
 *
 * The tray is a flex column and the panel grows, so cards side by side in a
 * grid row stay equal height.
 */
export const trayClass = "flex flex-col rounded-[22px] bg-muted/70 p-1 dark:bg-[oklch(0.19_0_0)]"
export const trayPanelClass =
  "flex-1 rounded-[18px] bg-card shadow-[0_1px_2px_rgb(0_0_0/0.05)] ring-1 ring-foreground/5 dark:bg-[oklch(0.245_0_0)] dark:ring-foreground/[0.06]"
