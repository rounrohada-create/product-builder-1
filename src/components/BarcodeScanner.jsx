/**
 * BarcodeScanner 컴포넌트
 * 바코드 스캔 및 수동 입력
 */
import { useState, useRef } from 'react';
import { Modal, Input, Button, Space, message, Tabs } from 'antd';
import { BarcodeOutlined, ScanOutlined, EditOutlined } from '@ant-design/icons';
import { triggerFeedback } from '../utils/feedback';
import { searchInventoryByBarcode } from '../services/googleSheetService';

const BarcodeScanner = ({ 
  visible, 
  onClose, 
  onBarcodeScanned 
}) => {
  const [barcode, setBarcode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');
  const scannerRef = useRef(null);

  // 수동 바코드 입력
  const handleManualInput = async () => {
    if (!barcode.trim()) {
      message.warning('바코드를 입력하세요');
      triggerFeedback('error');
      return;
    }

    triggerFeedback('click');
    message.loading({ content: '바코드 검색 중...', key: 'barcode' });

    try {
      const result = await searchInventoryByBarcode(barcode);
      
      if (result) {
        message.success({ content: '✅ 상품을 찾았습니다!', key: 'barcode' });
        triggerFeedback('success');
        onBarcodeScanned(result);
        handleClose();
      } else {
        message.warning({ content: '❌ 해당 바코드의 상품을 찾을 수 없습니다', key: 'barcode' });
        triggerFeedback('error');
      }
    } catch (error) {
      message.error({ content: '오류가 발생했습니다', key: 'barcode' });
      triggerFeedback('error');
    }
  };

  // 모달 닫기
  const handleClose = () => {
    setBarcode('');
    setScanning(false);
    onClose();
  };

  // 엔터키 처리
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleManualInput();
    }
  };

  const tabItems = [
    {
      key: 'manual',
      label: (
        <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
          <EditOutlined /> 수동 입력
        </span>
      ),
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ 
            textAlign: 'center', 
            padding: '20px',
            fontSize: '16px',
            color: '#666'
          }}>
            바코드 숫자를 직접 입력하거나<br />
            바코드 스캐너로 읽어주세요
          </div>

          <Input
            size="large"
            placeholder="바코드 번호 입력"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyPress={handleKeyPress}
            prefix={<BarcodeOutlined />}
            style={{ fontSize: '20px' }}
            autoFocus
          />

          <Button
            type="primary"
            size="large"
            block
            onClick={handleManualInput}
            icon={<ScanOutlined />}
            style={{ 
              height: '56px',
              fontSize: '18px',
              fontWeight: 'bold'
            }}
          >
            바코드 검색
          </Button>
        </Space>
      )
    },
    {
      key: 'camera',
      label: (
        <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
          <ScanOutlined /> 카메라 스캔
        </span>
      ),
      children: (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 20px',
          color: '#999'
        }}>
          <BarcodeOutlined style={{ fontSize: '64px', marginBottom: '16px' }} />
          <div style={{ fontSize: '16px', marginBottom: '24px' }}>
            카메라 바코드 스캔 기능은<br />
            html5-qrcode 라이브러리를 사용하여<br />
            추가 구현 가능합니다
          </div>
          <Button 
            type="dashed" 
            size="large"
            disabled
            style={{ fontSize: '16px', height: '48px' }}
          >
            카메라 스캔 (준비 중)
          </Button>
        </div>
      )
    }
  ];

  return (
    <Modal
      title={
        <div style={{ fontSize: '22px', fontWeight: 'bold' }}>
          🔍 바코드 스캔
        </div>
      }
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={500}
      centered
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
      />
    </Modal>
  );
};

export default BarcodeScanner;
