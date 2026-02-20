/**
 * QuantityInput 컴포넌트
 * 품목별 맞춤 수량 입력 UI
 * - 사이즈 있는 제품: 사이즈별 수량 입력 테이블
 * - 사이즈 없는 제품: +/- 버튼으로 수량 조절
 */
import { useState } from 'react';
import { Card, Button, InputNumber, Table, Space, Typography, Divider } from 'antd';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons';
import { triggerFeedback } from '../utils/feedback';

const { Title, Text } = Typography;

const QuantityInput = ({ 
  itemData, 
  mode,
  onQuantitySubmit 
}) => {
  const [quantities, setQuantities] = useState({});
  const [simpleQuantity, setSimpleQuantity] = useState(1);

  if (!itemData) {
    return null;
  }

  const hasSizes = itemData.sizes && itemData.sizes.length > 0;

  // 사이즈별 수량 변경
  const handleSizeQuantityChange = (size, value) => {
    setQuantities(prev => ({
      ...prev,
      [size]: value || 0
    }));
  };

  // 단순 수량 증가
  const increaseQuantity = () => {
    triggerFeedback('click');
    setSimpleQuantity(prev => prev + 1);
  };

  // 단순 수량 감소
  const decreaseQuantity = () => {
    triggerFeedback('click');
    if (simpleQuantity > 0) {
      setSimpleQuantity(prev => prev - 1);
    }
  };

  // 수량 제출
  const handleSubmit = () => {
    triggerFeedback('success');
    
    if (hasSizes) {
      // 사이즈별 수량 제출
      const totalQuantity = Object.values(quantities).reduce((sum, qty) => sum + (qty || 0), 0);
      onQuantitySubmit({
        ...itemData,
        quantities,
        totalQuantity,
        mode
      });
    } else {
      // 단순 수량 제출
      onQuantitySubmit({
        ...itemData,
        quantity: simpleQuantity,
        mode
      });
    }
  };

  // 사이즈 있는 제품 - 테이블 형태
  if (hasSizes) {
    const columns = [
      {
        title: <span style={{ fontSize: '18px', fontWeight: 'bold' }}>사이즈</span>,
        dataIndex: 'size',
        key: 'size',
        width: '40%',
        render: (text) => (
          <Text strong style={{ fontSize: '18px' }}>{text}</Text>
        )
      },
      {
        title: <span style={{ fontSize: '18px', fontWeight: 'bold' }}>수량</span>,
        dataIndex: 'quantity',
        key: 'quantity',
        width: '60%',
        render: (_, record) => (
          <InputNumber
            min={0}
            size="large"
            value={quantities[record.size] || 0}
            onChange={(value) => handleSizeQuantityChange(record.size, value)}
            style={{ 
              width: '100%',
              fontSize: '18px'
            }}
          />
        )
      }
    ];

    const dataSource = itemData.sizes.map((size, index) => ({
      key: index,
      size,
      quantity: 0
    }));

    return (
      <Card
        title={
          <div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
              📏 사이즈별 수량 입력
            </div>
            <div style={{ fontSize: '14px', fontWeight: 'normal', color: '#666' }}>
              {mode === '입고' ? '입고' : '출고'} 모드
            </div>
          </div>
        }
        style={{ height: '100%' }}
        bodyStyle={{ padding: '16px' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Text strong style={{ fontSize: '18px' }}>
              🏷️ {itemData.itemName}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: '16px' }}>
              품번: {itemData.itemCode}
            </Text>
          </div>

          <Table
            columns={columns}
            dataSource={dataSource}
            pagination={false}
            size="large"
            bordered
            scroll={{ y: 400 }}
          />

          <Divider />

          <Button
            type="primary"
            size="large"
            block
            onClick={handleSubmit}
            style={{ 
              height: '56px',
              fontSize: '18px',
              fontWeight: 'bold',
              backgroundColor: mode === '입고' ? '#52c41a' : '#ff4d4f',
              borderColor: mode === '입고' ? '#52c41a' : '#ff4d4f'
            }}
          >
            {mode === '입고' ? '📥 입고 처리' : '📤 출고 처리'}
          </Button>
        </Space>
      </Card>
    );
  }

  // 사이즈 없는 제품 - 간단한 +/- 버튼
  return (
    <Card
      title={
        <div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
            🔢 수량 입력
          </div>
          <div style={{ fontSize: '14px', fontWeight: 'normal', color: '#666' }}>
            {mode === '입고' ? '입고' : '출고'} 모드
          </div>
        </div>
      }
      style={{ height: '100%' }}
      bodyStyle={{ padding: '24px' }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <Text strong style={{ fontSize: '20px' }}>
            🏷️ {itemData.itemName}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '18px' }}>
            품번: {itemData.itemCode}
          </Text>
        </div>

        <Divider />

        {/* 큼직한 수량 조절 UI */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '24px',
          padding: '40px 0'
        }}>
          <Button
            type="primary"
            danger={mode === '출고'}
            shape="circle"
            icon={<MinusOutlined />}
            size="large"
            onClick={decreaseQuantity}
            disabled={simpleQuantity <= 0}
            style={{ 
              width: '80px',
              height: '80px',
              fontSize: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          />

          <div style={{ 
            minWidth: '120px',
            textAlign: 'center',
            fontSize: '48px',
            fontWeight: 'bold',
            color: mode === '입고' ? '#52c41a' : '#ff4d4f'
          }}>
            {simpleQuantity}
          </div>

          <Button
            type="primary"
            shape="circle"
            icon={<PlusOutlined />}
            size="large"
            onClick={increaseQuantity}
            style={{ 
              width: '80px',
              height: '80px',
              fontSize: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: mode === '입고' ? '#52c41a' : '#ff4d4f',
              borderColor: mode === '입고' ? '#52c41a' : '#ff4d4f'
            }}
          />
        </div>

        <Divider />

        <Button
          type="primary"
          size="large"
          block
          onClick={handleSubmit}
          disabled={simpleQuantity <= 0}
          style={{ 
            height: '64px',
            fontSize: '20px',
            fontWeight: 'bold',
            backgroundColor: mode === '입고' ? '#52c41a' : '#ff4d4f',
            borderColor: mode === '입고' ? '#52c41a' : '#ff4d4f'
          }}
        >
          {mode === '입고' ? '📥 입고 처리' : '📤 출고 처리'}
        </Button>
      </Space>
    </Card>
  );
};

export default QuantityInput;
