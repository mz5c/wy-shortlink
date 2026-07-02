import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import './index.css';

/** 方案A：数据密集仪表盘 — Ant Design 主题令牌 */
const themeConfig = {
  token: {
    // 品牌色
    colorPrimary: '#1E40AF',
    colorInfo: '#1E40AF',
    colorSuccess: '#16A34A',
    colorWarning: '#D97706',
    colorError: '#DC2626',

    // 圆角 — 紧凑
    borderRadius: 4,
    borderRadiusLG: 6,
    borderRadiusSM: 3,

    // 字体
    fontFamily: "'Fira Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontFamilyCode: "'Fira Code', 'SF Mono', 'Cascadia Code', Consolas, monospace",
    fontSize: 14,
    fontSizeLG: 15,
    fontSizeSM: 12,

    // 行高
    lineHeight: 1.5,

    // 间距 — 适度紧凑
    paddingXS: 4,
    paddingSM: 8,
    padding: 12,
    paddingMD: 16,
    paddingLG: 20,
    paddingXL: 24,
    marginXS: 4,
    marginSM: 8,
    margin: 12,
    marginMD: 16,
    marginLG: 20,
    marginXL: 24,

    // 控件高度
    controlHeight: 34,
    controlHeightLG: 40,
    controlHeightSM: 28,

    // 边框
    lineWidth: 1,
    colorBorder: '#E2E8F0',
    colorBorderSecondary: '#F1F5F9',

    // 背景
    colorBgLayout: '#F1F5F9',
    colorBgContainer: '#FFFFFF',
    colorBgElevated: '#FFFFFF',

    // 文字
    colorText: '#0F172A',
    colorTextSecondary: '#475569',
    colorTextTertiary: '#94A3B8',
    colorTextQuaternary: '#CBD5E1',
  },
  components: {
    Table: {
      cellPaddingBlock: 10,
      cellPaddingInline: 16,
      headerBg: '#F8FAFC',
      headerColor: '#475569',
      rowHoverBg: '#F1F5F9',
      borderColor: '#F1F5F9',
      headerSplitColor: '#E2E8F0',
      fontWeightStrong: 600,
    },
    Card: {
      paddingLG: 20,
      borderRadiusLG: 6,
    },
    Button: {
      borderRadius: 4,
      controlHeight: 34,
      controlHeightLG: 40,
      controlHeightSM: 28,
      paddingInline: 14,
      paddingInlineLG: 18,
      paddingInlineSM: 10,
    },
    Input: {
      borderRadius: 4,
      controlHeight: 34,
    },
    Select: {
      borderRadius: 4,
      controlHeight: 34,
    },
    Menu: {
      itemBorderRadius: 6,
      itemHeight: 40,
      iconSize: 16,
      collapsedIconSize: 18,
      fontSize: 13,
    },
    Layout: {
      siderBg: '#0F1D3D',
      triggerBg: '#0A1530',
      triggerColor: '#CBD5E1',
    },
    Pagination: {
      itemSize: 30,
      borderRadius: 4,
    },
    Tag: {
      borderRadiusSM: 3,
    },
    Modal: {
      borderRadiusLG: 8,
      paddingLG: 20,
    },
    Breadcrumb: {
      fontSize: 13,
      lastItemColor: '#0F172A',
      linkColor: '#475569',
      linkHoverColor: '#1E40AF',
    },
    Statistic: {
      contentFontSize: 28,
      titleFontSize: 12,
    },
  },
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <ConfigProvider locale={zhCN} theme={themeConfig}>
      <App />
    </ConfigProvider>
  </BrowserRouter>
);
