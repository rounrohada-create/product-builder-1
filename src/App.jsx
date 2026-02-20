import { useState } from 'react';
import { ConfigProvider, Layout, Tabs, message, Modal } from 'antd';
import koKR from 'antd/locale/ko_KR';
import { 
  ScanOutlined, 
  LoginOutlined, 
  LogoutOutlined, 
  SearchOutlined 
} from '@ant-design/icons';
import InboundTab from './components/tabs/InboundTab';
import OutboundTab from './components/tabs/OutboundTab';
import SearchTab from './components/tabs/SearchTab';
import { downloadExcelTemplate, parseExcelFile } from './utils/excelUtils';
import { syncToGoogleSheet } from './services/googleSheetService';
import { triggerFeedback } from './utils/feedback';
import './App.css';

const { Header, Content } = Layout;

function App() {
  const [activeTab, setActiveTab] = useState('inbound');
  const [inventoryData, setInventoryData] = useState([]);

  // 엑셀 템플릿 다운로드
  const handleDownloadTemplate = () => {
    try {
      downloadExcelTemplate();
      message.success('템플릿 다운로드 완료');
      triggerFeedback('success');
    } catch (error) {
      message.error('템플릿 다운로드 실패');
      triggerFeedback('error');
    }
  };

  // 엑셀 파일 업로드
  const handleUploadExcel = async (file) => {
    try {
      message.loading({ content: '엑셀 파일 처리 중...', key: 'upload' });
      const data = await parseExcelFile(file);
      setInventoryData(data);
      await syncToGoogleSheet(data);
      message.success({ content: `${data.length}개 품목 업로드 완료`, key: 'upload' });
      triggerFeedback('success');
    } catch (error) {
      message.error({ content: '엑셀 업로드 실패', key: 'upload' });
      triggerFeedback('error');
    }
  };

  const tabItems = [
    {
      key: 'inbound',
      label: (
        <span className="tab-label">
          <LoginOutlined />
          <span>입고</span>
        </span>
      ),
      children: (
        <InboundTab 
          inventoryData={inventoryData}
          onUploadExcel={handleUploadExcel}
          onDownloadTemplate={handleDownloadTemplate}
        />
      )
    },
    {
      key: 'outbound',
      label: (
        <span className="tab-label">
          <LogoutOutlined />
          <span>출고</span>
        </span>
      ),
      children: (
        <OutboundTab 
          inventoryData={inventoryData}
          onUploadExcel={handleUploadExcel}
          onDownloadTemplate={handleDownloadTemplate}
        />
      )
    },
    {
      key: 'search',
      label: (
        <span className="tab-label">
          <SearchOutlined />
          <span>조회</span>
        </span>
      ),
      children: (
        <SearchTab 
          inventoryData={inventoryData}
          onUploadExcel={handleUploadExcel}
          onDownloadTemplate={handleDownloadTemplate}
        />
      )
    }
  ];

  const handleTabChange = (key) => {
    triggerFeedback('click');
    setActiveTab(key);
  };

  return (
    <ConfigProvider
      locale={koKR}
      theme={{
        token: {
          colorPrimary: '#1890ff',
          colorBgContainer: '#ffffff',
          fontSize: 14,
          borderRadius: 8,
        },
        components: {
          Tabs: {
            cardHeight: 48,
            fontSize: 16,
          }
        }
      }}
    >
      <Layout className="app-layout">
        {/* 헤더 */}
        <Header className="app-header">
          <div className="header-content">
            <h1 className="app-title">SMART STOCK PRO</h1>
          </div>
        </Header>

        {/* 탭 네비게이션 */}
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
          centered
          className="main-tabs"
          size="large"
        />
      </Layout>
    </ConfigProvider>
  );
}

export default App;
