/**
 * AIDataEditor 컴포넌트
 * AI가 추출한 데이터 확인 및 수정
 */
import { useState } from 'react';
import { Card, Form, Input, InputNumber, Tag, Space, Button, Divider } from 'antd';
import { EditOutlined, CheckOutlined, BarcodeOutlined } from '@ant-design/icons';
import { triggerFeedback } from '../utils/feedback';

const AIDataEditor = ({ 
  analysisResult, 
  onDataConfirm,
  onBarcodeLink 
}) => {
  const [form] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);

  if (!analysisResult) {
    return (
      <Card 
        title={
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
            🤖 AI 분석 결과
          </div>
        }
        style={{ height: '100%' }}
      >
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 20px',
          color: '#999',
          fontSize: '16px'
        }}>
          이미지를 분석하면 결과가 여기에 표시됩니다.
        </div>
      </Card>
    );
  }

  const handleEdit = () => {
    triggerFeedback('click');
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      triggerFeedback('success');
      setIsEditing(false);
      onDataConfirm({ ...analysisResult, ...values });
    } catch (error) {
      console.error('폼 검증 오류:', error);
      triggerFeedback('error');
    }
  };

  const handleBarcodeClick = () => {
    triggerFeedback('click');
    // 바코드 스캐너 모달 열기
    onBarcodeLink(analysisResult);
  };

  // 신뢰도에 따른 색상 결정
  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return 'green';
    if (confidence >= 0.7) return 'orange';
    return 'red';
  };

  return (
    <Card 
      title={
        <div style={{ 
          fontSize: '20px', 
          fontWeight: 'bold',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>🤖 AI 분석 결과</span>
          <Tag 
            color={getConfidenceColor(analysisResult.confidence)}
            style={{ fontSize: '14px', padding: '4px 12px' }}
          >
            신뢰도: {(analysisResult.confidence * 100).toFixed(0)}%
          </Tag>
        </div>
      }
      style={{ height: '100%' }}
      bodyStyle={{ padding: '16px' }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={analysisResult}
        disabled={!isEditing}
      >
        {/* 품번 */}
        <Form.Item
          label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>📦 품번</span>}
          name="itemCode"
          rules={[{ required: true, message: '품번을 입력하세요' }]}
        >
          <Input 
            size="large" 
            placeholder="품번 입력"
            style={{ fontSize: '18px' }}
          />
        </Form.Item>

        {/* 상품명 */}
        <Form.Item
          label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>🏷️ 상품명</span>}
          name="itemName"
          rules={[{ required: true, message: '상품명을 입력하세요' }]}
        >
          <Input 
            size="large" 
            placeholder="상품명 입력"
            style={{ fontSize: '18px' }}
          />
        </Form.Item>

        {/* 현재고 */}
        <Form.Item
          label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>📊 현재고</span>}
          name="currentStock"
        >
          <InputNumber 
            size="large" 
            min={0}
            style={{ width: '100%', fontSize: '18px' }}
            placeholder="현재고 입력"
          />
        </Form.Item>

        {/* 사이즈 정보 */}
        {analysisResult.sizes && analysisResult.sizes.length > 0 && (
          <Form.Item
            label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>📏 사이즈</span>}
          >
            <Space wrap size="small">
              {analysisResult.sizes.map((size, index) => (
                <Tag 
                  key={index} 
                  color="blue"
                  style={{ 
                    fontSize: '16px', 
                    padding: '8px 16px',
                    margin: '4px'
                  }}
                >
                  {size}
                </Tag>
              ))}
            </Space>
          </Form.Item>
        )}

        {/* 바코드 */}
        <Form.Item
          label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>🔢 바코드</span>}
          name="barcode"
        >
          <Input 
            size="large" 
            placeholder="바코드 입력"
            style={{ fontSize: '18px' }}
            suffix={
              <Button
                type="text"
                icon={<BarcodeOutlined />}
                onClick={handleBarcodeClick}
                style={{ fontSize: '20px' }}
              />
            }
          />
        </Form.Item>
      </Form>

      <Divider />

      {/* 액션 버튼 */}
      <Space style={{ width: '100%' }} direction="vertical" size="middle">
        {!isEditing ? (
          <>
            <Button
              type="primary"
              icon={<EditOutlined />}
              size="large"
              block
              onClick={handleEdit}
              style={{ 
                height: '56px',
                fontSize: '18px',
                fontWeight: 'bold'
              }}
            >
              정보 수정하기
            </Button>
            <Button
              type="default"
              size="large"
              block
              onClick={() => {
                triggerFeedback('success');
                onDataConfirm(analysisResult);
              }}
              style={{ 
                height: '56px',
                fontSize: '18px',
                fontWeight: 'bold',
                backgroundColor: '#52c41a',
                color: 'white',
                border: 'none'
              }}
            >
              ✅ 이대로 확정
            </Button>
          </>
        ) : (
          <>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              size="large"
              block
              onClick={handleSave}
              style={{ 
                height: '56px',
                fontSize: '18px',
                fontWeight: 'bold'
              }}
            >
              저장하기
            </Button>
            <Button
              size="large"
              block
              onClick={() => {
                triggerFeedback('click');
                form.resetFields();
                setIsEditing(false);
              }}
              style={{ 
                height: '56px',
                fontSize: '18px',
                fontWeight: 'bold'
              }}
            >
              취소
            </Button>
          </>
        )}
      </Space>
    </Card>
  );
};

export default AIDataEditor;
