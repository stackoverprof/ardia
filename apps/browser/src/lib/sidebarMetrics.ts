export const SIDEBAR_ROW = { height: 34, gap: 3 } as const;

// (fork) Every group sits in its own box, tabs not indented, with `gap` of space above and below each box.
export const SIDEBAR_GROUP = { indent: 3, border: 0.5, radius: 12, inset: 3, gap: 3 } as const;

// (fork) Rows inside a group box (its header and its tabs) are shorter, so a group reads compact.
export const SIDEBAR_GROUP_ROW = { height: 28 } as const;

export const GROUP_MEMBERS_PAD_BOTTOM = SIDEBAR_GROUP.inset - SIDEBAR_GROUP.border;
