/**
 * AppHeader 컴포넌트
 * 작업 모드 전환 (입고/출고/조회) 및 설정
 */
import { Layout, Radio, Button, Space, Typography } from 'antd';
import { DownloadOutlined, UploadOutlined, SettingOutlined, SyncOutlined } from '@ant-design/icons';
import { triggerFeedback } from '../utils/feedback';

const { Header } = Layout;
const { Title } = Typography;

const AppHeader = ({ 
  mode, 
  onModeChange, 
  onDownloadTemplate, 
  onUploadExcel,
  onSync 
}) => {
  const handleModeChange = (e) => {
    triggerFeedback('click');
    onModeChange(e.target.value);
  };

  const handleDownloadClick = () => {
    triggerFeedback('click');
    onDownloadTemplate();
  };

  const handleUploadClick = () => {
    triggerFeedback('click');
    document.getElementById('excel-upload').click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      triggerFeedback('success');
      onUploadExcel(file);
    }
  };

  const handleSyncClick = () => {
    triggerFeedback('click');
    onSync();
  };

  return (
    <Header 
      style={{ 
        background: '#001529', 
        padding: '12px 16px',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <Title level={4} style={{ margin: 0, color: 'white', fontSize: '20px' }}>
            📦 AI 듀얼 재고 마스터
          </Title>
          
          <Button
            type="primary"
            icon={<SyncOutlined />}
            size="large"
            onClick={handleSyncClick}
            style={{ 
              fontSize: '16px',
              height: '48px'
            }}
          >
            동기화
          </Button>
        </div>

        {/* 작업 모드 전환 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          width: '100%'
        }}>
          <Radio.Group 
            value={mode} 
            onChange={handleModeChange}
            size="large"
            buttonStyle="solid"
            style={{ width: '100%', maxWidth: '500px' }}
          >
            <Radio.Button 
              value="입고" 
              style={{ 
                flex: 1, 
                textAlign: 'center',
                fontSize: '18px',
                height: '56px',
                lineHeight: '56px',
                fontWeight: 'bold'
              }}
            >
              📥 입고
            </Radio.Button>
            <Radio.Button 
              value="출고" 
              style={{ 
                flex: 1, 
                textAlign: 'center',
                fontSize: '18px',
                height: '56px',
                lineHeight: '56px',
                fontWeight: 'bold'
              }}
            >
              📤 출고
            </Radio.Button>
            <Radio.Button 
              value="조회" 
              style={{ 
                flex: 1, 
                textAlign: 'center',
                fontSize: '18px',
                height: '56px',
                lineHeight: '56px',
                fontWeight: 'bold'
              }}
            >
              🔍 조회
            </Radio.Button>
          </Radio.Group>
        </div>

        {/* 엑셀 관리 버튼 */}
        <div style={{ 
          display: 'flex', 
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <Button
            icon={<DownloadOutlined />}
            size="large"
            onClick={handleDownloadClick}
            style={{ 
              fontSize: '16px',
              height: '48px',
              minWidth: '180px'
            }}
          >
            템플릿 다운로드
          </Button>
          <Button
            icon={<UploadOutlined />}
            size="large"
            onClick={handleUploadClick}
            style={{ 
              fontSize: '16px',
              height: '48px',
              minWidth: '180px'
            }}
          >
            엑셀 업로드
          </Button>
          <input
            id="excel-upload"
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
      </Space>
    </Header>
  );
};

export default AppHeader;
