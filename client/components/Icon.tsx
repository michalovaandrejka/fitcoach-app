import React from "react";
import Svg, { Path } from "react-native-svg";

export type IconName =
  | "add-circle-outline"
  | "add-outline"
  | "alert-circle-outline"
  | "arrow-back-outline"
  | "arrow-forward-outline"
  | "calendar-outline"
  | "call-outline"
  | "camera-outline"
  | "chatbubble-outline"
  | "checkmark-circle-outline"
  | "checkmark-outline"
  | "chevron-back-outline"
  | "chevron-forward-outline"
  | "clipboard-outline"
  | "close-circle-outline"
  | "close-outline"
  | "create-outline"
  | "document-text-outline"
  | "eye-off-outline"
  | "eye-outline"
  | "flash-outline"
  | "hand-left-outline"
  | "heart-outline"
  | "help-circle-outline"
  | "home-outline"
  | "information-circle-outline"
  | "locate-outline"
  | "location-outline"
  | "log-out-outline"
  | "mail-outline"
  | "menu-outline"
  | "notifications-outline"
  | "people-outline"
  | "person-add-outline"
  | "person-outline"
  | "play-outline"
  | "pulse-outline"
  | "ribbon-outline"
  | "save-outline"
  | "search-outline"
  | "send-outline"
  | "settings-outline"
  | "shield-outline"
  | "time-outline"
  | "trash-outline";

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  style?: any;
};

const iconPaths: Record<IconName, string[]> = {
  "add-circle-outline": [
    "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z",
    "M12 8v8",
    "M8 12h8",
  ],
  "add-outline": [
    "M12 5v14",
    "M5 12h14",
  ],
  "alert-circle-outline": [
    "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z",
    "M12 8v4",
    "M12 16h.01",
  ],
  "arrow-back-outline": [
    "M19 12H5",
    "M12 19l-7-7 7-7",
  ],
  "arrow-forward-outline": [
    "M5 12h14",
    "M12 5l7 7-7 7",
  ],
  "calendar-outline": [
    "M4 4h16a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z",
    "M16 2v4",
    "M8 2v4",
    "M3 10h18",
  ],
  "call-outline": [
    "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
  ],
  "camera-outline": [
    "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z",
    "M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  ],
  "chatbubble-outline": [
    "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  ],
  "checkmark-circle-outline": [
    "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z",
    "M9 12l2 2 4-4",
  ],
  "checkmark-outline": [
    "M20 6L9 17l-5-5",
  ],
  "chevron-back-outline": [
    "M15 18l-6-6 6-6",
  ],
  "chevron-forward-outline": [
    "M9 18l6-6-6-6",
  ],
  "clipboard-outline": [
    "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",
    "M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z",
  ],
  "close-circle-outline": [
    "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z",
    "M15 9l-6 6",
    "M9 9l6 6",
  ],
  "close-outline": [
    "M18 6L6 18",
    "M6 6l12 12",
  ],
  "create-outline": [
    "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",
    "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  ],
  "document-text-outline": [
    "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
    "M14 2v6h6",
    "M16 13H8",
    "M16 17H8",
    "M10 9H8",
  ],
  "eye-off-outline": [
    "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94",
    "M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19",
    "M14.12 14.12a3 3 0 1 1-4.24-4.24",
    "M1 1l22 22",
  ],
  "eye-outline": [
    "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z",
    "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  ],
  "flash-outline": [
    "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  ],
  "hand-left-outline": [
    "M18 11V6a2 2 0 0 0-4 0",
    "M14 10V4a2 2 0 0 0-4 0v6",
    "M10 10.5V6a2 2 0 0 0-4 0v9",
    "M18 11a2 2 0 0 1 4 0v3a8 8 0 0 1-8 8H12a8 8 0 0 1-6-2.69",
  ],
  "heart-outline": [
    "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
  ],
  "help-circle-outline": [
    "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z",
    "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",
    "M12 17h.01",
  ],
  "home-outline": [
    "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
    "M9 22V12h6v10",
  ],
  "information-circle-outline": [
    "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z",
    "M12 16v-4",
    "M12 8h.01",
  ],
  "locate-outline": [
    "M12 2v4",
    "M12 18v4",
    "M2 12h4",
    "M18 12h4",
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  ],
  "location-outline": [
    "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z",
    "M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  ],
  "log-out-outline": [
    "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",
    "M16 17l5-5-5-5",
    "M21 12H9",
  ],
  "mail-outline": [
    "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
    "M22 6l-10 7L2 6",
  ],
  "menu-outline": [
    "M3 12h18",
    "M3 6h18",
    "M3 18h18",
  ],
  "notifications-outline": [
    "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9",
    "M13.73 21a2 2 0 0 1-3.46 0",
  ],
  "people-outline": [
    "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2",
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    "M23 21v-2a4 4 0 0 0-3-3.87",
    "M16 3.13a4 4 0 0 1 0 7.75",
  ],
  "person-add-outline": [
    "M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2",
    "M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    "M20 8v6",
    "M23 11h-6",
  ],
  "person-outline": [
    "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2",
    "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  ],
  "play-outline": [
    "M5 3l14 9-14 9V3z",
  ],
  "pulse-outline": [
    "M22 12h-4l-3 9L9 3l-3 9H2",
  ],
  "ribbon-outline": [
    "M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12z",
    "M8.21 13.89L7 23l5-3 5 3-1.21-9.12",
  ],
  "save-outline": [
    "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z",
    "M17 21v-8H7v8",
    "M7 3v5h8",
  ],
  "search-outline": [
    "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z",
    "M21 21l-4.35-4.35",
  ],
  "send-outline": [
    "M22 2L11 13",
    "M22 2l-7 20-4-9-9-4 20-7z",
  ],
  "settings-outline": [
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  ],
  "shield-outline": [
    "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  ],
  "time-outline": [
    "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z",
    "M12 6v6l4 2",
  ],
  "trash-outline": [
    "M3 6h18",
    "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
    "M10 11v6",
    "M14 11v6",
  ],
};

export function Icon({ name, size = 24, color = "#000000", style }: IconProps) {
  const paths = iconPaths[name];

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={style}
    >
      {paths.map((d, i) => (
        <Path
          key={i}
          d={d}
          stroke={color}
          fill="none"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}
