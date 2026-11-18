import { createContext, useContext } from "react";
import { SIDEBAR_GROUP_ROW } from "../../lib/sidebarMetrics";
import { layout } from "../ui/theme";

// (fork) Rows inside a group box are shorter than the rest of the sidebar. GroupBlock provides the group height;
// everything else gets the normal row height. state/sidebar/geometry.ts mirrors this for positions.
export const GROUP_ROW_HEIGHT = SIDEBAR_GROUP_ROW.height;
export const RowHeight = createContext<number>(layout.rowHeight);
export const useRowHeight = () => useContext(RowHeight);
