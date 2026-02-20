/**
 * 입고 탭 컴포넌트
 */
import { useState, useRef } from 'react';
import { 
  Card, 
  Button, 
  Input, 
  InputNumber, 
  Form, 
  Space, 
  Upload, 
  message,
  Divider,
  Badge,
  Tag,
  Row,
  Col,
  Modal
} from 'antd';
import {
  CameraOutlined,
  PictureOutlined,
  BarcodeOutlined,
  CheckCircleOutlined,
  DownloadOutlined,
  UploadOutlined,
  ScanOutlined
} from '@ant-design/icons';
import Webcam from 'react-webcam';
import { triggerFeedback } from '../../utils/feedback';
import { analyzeImageWithGemini } from '../../services/geminiService';
import './InboundTab.css';

const InboundTab = ({ inventoryData, onUploadExcel, onDownloadTemplate }) => {
  const [step, setStep] = useState(1); // 1: 스캔, 2: AI 결과, 3: 수량 입력
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [form] = Form.useForm();
  const [sizeQuantities, setSizeQuantities] = useState({});
  const [barcodeModalVisible, setBarcodeModalVisible] = useState(false);
  const [barcode, setBarcode] = useState('');
  const webcamRef = useRef(null);

  // 카메라 활성화
  const handleCameraToggle = () => {
    triggerFeedback('click');
    setCameraActive(!cameraActive);
    setCapturedImage(null);
  };

  // 사진 촬영
  const handleCapture = () => {
    triggerFeedback('click');
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
    setCameraActive(false);
    
    // 자동으로 AI 분석 시작
    fetch(imageSrc)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'captured.jpg', { type: 'image/jpeg' });
        handleImageAnalysis(file);
      });
  };

  // 이미지 분석
  const handleImageAnalysis = async (file) => {
    setAnalyzing(true);
    message.loading({ content: 'AI 분석 중...', key: 'analyzing', duration: 0 });

    try {
      const result = await analyzeImageWithGemini(file);
      setAiResult(result);
      form.setFieldsValue(result);
      setStep(2);
      message.success({ content: 'AI 분석 완료', key: 'analyzing' });
      triggerFeedback('success');
    } catch (error) {
      message.error({ content: '분석 실패', key: 'analyzing' });
      triggerFeedback('error');
    } finally {
      setAnalyzing(false);
    }
  };

  // 이미지 업로드
  const handleFileUpload = ({ file }) => {
    triggerFeedback('click');
    if (file.type.startsWith('image/')) {
      setCapturedImage(URL.createObjectURL(file));
      handleImageAnalysis(file);
    } else {
      message.error('이미지 파일만 업로드 가능합니다');
      triggerFeedback('error');
    }
  };

  // 정보 확정
  const handleConfirm = async () => {
    try {
      const values = await form.validateFields();
      setAiResult(values);
      setStep(3);
      triggerFeedback('success');
    } catch (error) {
      triggerFeedback('error');
    }
  };

  // 사이즈별 수량 변경
  const handleSizeQuantityChange = (size, value) => {
    setSizeQuantities(prev => ({
      ...prev,
      [size]: value || 0
    }));
  };

  // 입고 처리
  const handleSubmit = () => {
    const hasSizes = aiResult?.sizes && aiResult.sizes.length > 0;
    
    let totalQuantity = 0;
    if (hasSizes) {
      totalQuantity = Object.values(sizeQuantities).reduce((sum, qty) => sum + qty, 0);
    } else {
      totalQuantity = form.getFieldValue('quantity') || 0;
    }

    if (totalQuantity === 0) {
      message.warning('수량을 입력해주세요');
      triggerFeedback('error');
      return;
    }

    Modal.confirm({
      title: '입고 처리 확인',
      content: (
        <div>
          <p><strong>품번:</strong> {aiResult.itemCode}</p>
          <p><strong>상품명:</strong> {aiResult.itemName}</p>
          <p><strong>총 수량:</strong> {totalQuantity}개</p>
        </div>
      ),
      onOk: () => {
        message.success('입고 처리 완료');
        triggerFeedback('success');
        // 초기화
        setStep(1);
        setCapturedImage(null);
        setAiResult(null);
        setSizeQuantities({});
        form.resetFields();
      }
    });
  };

  // 재스캔
  const handleRescan = () => {
    triggerFeedback('click');
    setStep(1);
    setCapturedImage(null);
    setAiResult(null);
    setSizeQuantities({});
    form.resetFields();
  };

  // 바코드 스캔
  const handleBarcodeSearch = () => {
    if (!barcode.trim()) {
      message.warning('바코드를 입력하세요');
      return;
    }
    message.info('바코드 검색 기능 (준비 중)');
    setBarcodeModalVisible(false);
    setBarcode('');
  };

  return (
    <div className="inbound-tab">
      {/* 상단 액션 버튼 */}
      <div className="top-actions">
        <Button 
          icon={<DownloadOutlined />}
          onClick={onDownloadTemplate}
          size="large"
        >
          템플릿
        </Button>
        <Button 
          icon={<UploadOutlined />}
          onClick={() => document.getElementById('excel-upload').click()}
          size="large"
        >
          엑셀
        </Button>
        <Button 
          icon={<BarcodeOutlined />}
          onClick={() => setBarcodeModalVisible(true)}
          size="large"
        >
          바코드
        </Button>
        <input
          id="excel-upload"
          type="file"
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
          onChange={(e) => onUploadExcel(e.target.files[0])}
        />
      </div>

      {/* Step 1: 스캔 */}
      {step === 1 && (
        <Card className="scan-card">
          <div className="scan-area">
            {cameraActive ? (
              <>
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: 'environment' }}
                  className="webcam-view"
                />
                <Button
                  type="primary"
                  icon={<CameraOutlined />}
                  size="large"
                  onClick={handleCapture}
                  className="capture-btn"
                >
                  촬영하기
                </Button>
              </>
            ) : capturedImage ? (
              <>
                <img src={capturedImage} alt="Captured" className="captured-image" />
                {analyzing && <div className="analyzing-overlay">AI 분석 중...</div>}
              </>
            ) : (
              <div className="scan-placeholder">
                <ScanOutlined className="scan-icon" />
                <p>상품 사진을 촬영하거나<br />이미지를 업로드하세요</p>
              </div>
            )}
          </div>

          <Space direction="vertical" style={{ width: '100%', marginTop: 16 }} size="middle">
            {!cameraActive && !capturedImage && (
              <>
                <Button
                  type="primary"
                  icon={<CameraOutlined />}
                  size="large"
                  block
                  onClick={handleCameraToggle}
                >
                  카메라 촬영
                </Button>
                <Upload
                  beforeUpload={() => false}
                  onChange={handleFileUpload}
                  showUploadList={false}
                  accept="image/*"
                >
                  <Button
                    icon={<PictureOutlined />}
                    size="large"
                    block
                  >
                    이미지 업로드
                  </Button>
                </Upload>
              </>
            )}
            {cameraActive && (
              <Button
                danger
                size="large"
                block
                onClick={handleCameraToggle}
              >
                취소
              </Button>
            )}
          </Space>
        </Card>
      )}

      {/* Step 2: AI 결과 확인 */}
      {step === 2 && aiResult && (
        <Card className="result-card">
          <div className="result-header">
            <h3>AI 발품 결과</h3>
            <Badge 
              count={`신뢰도 ${Math.round(aiResult.confidence * 100)}%`} 
              style={{ backgroundColor: aiResult.confidence >= 0.9 ? '#52c41a' : '#faad14' }}
            />
          </div>

          <Form form={form} layout="vertical" className="result-form">
            <Form.Item label="품번" name="itemCode" rules={[{ required: true }]}>
              <Input size="large" placeholder="품번 입력" />
            </Form.Item>

            <Form.Item label="상품명" name="itemName" rules={[{ required: true }]}>
              <Input size="large" placeholder="상품명 입력" />
            </Form.Item>

            <Form.Item label="공급가" name="currentStock">
              <InputNumber 
                size="large" 
                style={{ width: '100%' }}
                formatter={value => `₩ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/₩\s?|(,*)/g, '')}
              />
            </Form.Item>

            {aiResult.sizes && aiResult.sizes.length > 0 && (
              <Form.Item label="사이즈">
                <Space wrap>
                  {aiResult.sizes.map(size => (
                    <Tag key={size} color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
                      {size}
                    </Tag>
                  ))}
                </Space>
              </Form.Item>
            )}

            <Form.Item label="바코드" name="barcode">
              <Input 
                size="large" 
                placeholder="바코드 입력"
                prefix={<BarcodeOutlined />}
              />
            </Form.Item>
          </Form>

          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              size="large"
              block
              onClick={handleConfirm}
            >
              정보 확정
            </Button>
            <Button
              size="large"
              block
              onClick={handleRescan}
            >
              다시 스캔
            </Button>
          </Space>
        </Card>
      )}

      {/* Step 3: 수량 입력 */}
      {step === 3 && aiResult && (
        <Card className="quantity-card">
          <div className="product-info">
            <h3>{aiResult.itemName}</h3>
            <p className="item-code">품번: {aiResult.itemCode}</p>
          </div>

          <Divider />

          {aiResult.sizes && aiResult.sizes.length > 0 ? (
            // 사이즈별 수량 입력
            <div className="size-quantity-section">
              <h4>사이즈 / 수량</h4>
              <div className="size-grid">
                {aiResult.sizes.map(size => (
                  <div key={size} className="size-item">
                    <div className="size-badge">{size}</div>
                    <InputNumber
                      min={0}
                      value={sizeQuantities[size] || 0}
                      onChange={(value) => handleSizeQuantityChange(size, value)}
                      size="large"
                      className="quantity-input"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // 단순 수량 입력
            <div className="simple-quantity-section">
              <h4>동록 수량</h4>
              <Form.Item name="quantity" initialValue={24}>
                <InputNumber
                  min={0}
                  size="large"
                  style={{ width: '100%', fontSize: 32, height: 80 }}
                  className="large-quantity-input"
                />
              </Form.Item>
            </div>
          )}

          <Divider />

          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Button
              type="primary"
              size="large"
              block
              onClick={handleSubmit}
              className="submit-btn"
            >
              소장
            </Button>
            <Button
              size="large"
              block
              onClick={handleRescan}
            >
              커리하
            </Button>
          </Space>
        </Card>
      )}

      {/* 바코드 모달 */}
      <Modal
        title="바코드 스캔"
        open={barcodeModalVisible}
        onCancel={() => setBarcodeModalVisible(false)}
        footer={null}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Input
            size="large"
            placeholder="바코드 번호 입력"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onPressEnter={handleBarcodeSearch}
            prefix={<BarcodeOutlined />}
          />
          <Button
            type="primary"
            size="large"
            block
            onClick={handleBarcodeSearch}
          >
            검색
          </Button>
        </Space>
      </Modal>
    </div>
  );
};

export default InboundTab;
