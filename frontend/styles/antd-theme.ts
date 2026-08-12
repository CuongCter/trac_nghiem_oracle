import type { ThemeConfig } from "antd";

/**
 * AntD theme mapped from the hand-drawn design system tokens.
 * Combines with styles/antd-overrides.css to make AntD look like the
 * pencil-on-cream aesthetic.
 */
export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: "#1dad97",
    colorSuccess: "#1dad97",
    colorError: "#c0392b",
    colorWarning: "#e69a1a",
    colorInfo: "#3D4980",
    colorTextBase: "#1f1b12",
    colorBgBase: "#fffaf5",
    colorBgContainer: "#f4eddf",
    colorBgElevated: "#f4eddf",
    colorBgLayout: "#fffaf5",
    colorBorder: "#c9b795",
    colorBorderSecondary: "#e5d7bf",
    fontFamily: '"Elms Sans", system-ui, sans-serif',
    fontSize: 16,
    borderRadius: 16,
    borderRadiusLG: 24,
    borderRadiusSM: 8,
    borderRadiusXS: 999,
    wireframe: false,
  },
  components: {
    Button: {
      controlHeight: 44,
      controlHeightLG: 52,
      controlHeightSM: 36,
      fontWeight: 500,
      primaryShadow: "none",
      defaultShadow: "none",
      dangerShadow: "none",
      defaultBg: "#f4eddf",
      defaultColor: "#1f1b12",
      defaultBorderColor: "#2b2418",
      defaultHoverBg: "#ece3d0",
      defaultHoverColor: "#1f1b12",
      defaultHoverBorderColor: "#2b2418",
      primaryColor: "#fffaf5",
      primaryHoverColor: "#fffaf5",
    },
    Card: {
      borderRadiusLG: 24,
      colorBgContainer: "#f4eddf",
      headerBg: "transparent",
      headerHeight: 56,
      headerHeightSM: 48,
      paddingLG: 24,
    },
    Input: {
      controlHeight: 44,
      controlHeightLG: 52,
      controlHeightSM: 36,
      borderRadius: 999,
      borderRadiusLG: 999,
      activeShadow: "0 0 0 4px #b9efe2",
      errorActiveShadow: "0 0 0 4px #f5cfcb",
      paddingBlock: 12,
      paddingInline: 20,
    },
    InputNumber: {
      controlHeight: 44,
      borderRadius: 999,
    },
    Select: {
      controlHeight: 44,
      borderRadius: 999,
      borderRadiusLG: 999,
    },
    DatePicker: {
      controlHeight: 44,
      borderRadius: 999,
      borderRadiusLG: 999,
    },
    Table: {
      borderRadius: 24,
      borderRadiusLG: 24,
      headerBg: "#ece3d0",
      headerColor: "#1f1b12",
      headerBorderRadius: 16,
      rowHoverBg: "#f4eddf",
      cellPaddingBlock: 18,
      cellPaddingInline: 24,
    },
    Modal: {
      borderRadiusLG: 24,
      colorBgElevated: "#f4eddf",
      paddingContentHorizontalLG: 24,
    },
    Tag: {
      borderRadiusSM: 999,
      defaultBg: "#f4eddf",
      defaultColor: "#1f1b12",
    },
    Tabs: {
      itemColor: "#6f6151",
      itemHoverColor: "#1f1b12",
      itemSelectedColor: "#168478",
      inkBarColor: "#1dad97",
      titleFontSize: 14,
    },
    Pagination: {
      itemBg: "#f4eddf",
      itemActiveBg: "#1dad97",
      itemActiveColor: "#fffaf5",
      itemSize: 40,
      borderRadius: 999,
    },
    Steps: {
      iconSize: 32,
      titleLineHeight: 1.5,
    },
    Progress: {
      defaultColor: "#1dad97",
      remainingColor: "#f4eddf",
    },
    Dropdown: {
      controlItemBgHover: "#ece3d0",
      borderRadiusLG: 24,
    },
    Menu: {
      itemBg: "transparent",
      itemColor: "#1f1b12",
      itemHoverBg: "#ece3d0",
      itemActiveBg: "#e8f9f4",
      itemSelectedBg: "#e8f9f4",
      itemSelectedColor: "#0e574e",
      itemBorderRadius: 999,
      itemHeight: 40,
    },
    Form: {
      labelColor: "#1f1b12",
      labelFontSize: 14,
    },
    Checkbox: {
      borderRadius: 6,
      controlInteractiveSize: 20,
    },
    Radio: {
      buttonSolidCheckedBg: "#1dad97",
      buttonSolidCheckedHoverBg: "#168478",
    },
    Switch: {
      handleBg: "#fffaf5",
    },
    Tooltip: {
      colorBgSpotlight: "#2b2418",
      colorTextLightSolid: "#fffaf5",
      borderRadius: 999,
    },
    Message: {
      contentBg: "#f4eddf",
      borderRadiusLG: 24,
    },
    Notification: {
      borderRadiusLG: 24,
    },
  },
};

export default antdTheme;
