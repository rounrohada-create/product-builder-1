/**
 * 입고 탭 컴포넌트 (동적 사이즈 추출 방식)
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
  Modal
} from 'antd';
import {
  CameraOutlined,
  PictureOutlined,
  BarcodeOutlined,
  CheckCircleOutlined,
  DownloadOutlined,
  UploadOutlined,
  ScanOutlined,
  PlusOutlined,
  MinusOutlined
} from '@ant-design/icons';
import Webcam from 'react-webcam';
import { triggerFeedback } from '../../utils/feedback';
import { analyzeImageWithGemini } from '../../services/geminiService';
import './InboundTab.css';

const InboundTab = ({ inventoryData, onUploadExcel, onDownloadTemplate, mode = 'inbound' }) => {
  const [step, setStep] = useState(1); // 1: 스캔, 2: AI 결과, 3: 수량 입력
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [form] = Form.useForm();
  const [sizeQuantities, setSizeQuantities] = useState({});
  const [simpleQuantity, setSimpleQuantity] = useState(0);
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
    message.loading({ content: 'AI가 사진을 정밀 분석하고 있습니다...', key: 'analyzing', duration: 0 });

    try {
      const result = await analyzeImageWithGemini(file);
      
      // 재촬영 필요 체크
      if (result.needRescan || result.confidence < 0.6) {
        message.warning({ 
          content: result.message || '사진이 흐릿합니다. 조명을 밝게 하고 다시 촬영해 주세요.', 
          key: 'analyzing',
          duration: 5
        });
        triggerFeedback('error');
        setCapturedImage(null);
        return;
      }
      
      setAiResult(result);
      form.setFieldsValue({
        brand: result.brand,
        itemCode: result.itemCode,
        itemName: result.itemName,
        price: result.price,
        barcode: result.barcode
      });
      
      // 사이즈별 수량 초기화
      if (result.sizes && result.sizes.length > 0) {
        const initialQuantities = {};
        result.sizes.forEach(size => {
          initialQuantities[size] = 0;
        });
        setSizeQuantities(initialQuantities);
      } else {
        setSimpleQuantity(0);
      }
      
      setStep(2);
      message.success({ 
        content: `✅ AI 분석 완료! (신뢰도: ${Math.round(result.confidence * 100)}%)`, 
        key: 'analyzing',
        duration: 2
      });
      triggerFeedback('success');
    } catch (error) {
      console.error('분석 오류:', error);
      message.error({ content: '❌ 분석 실패. 다시 시도해주세요.', key: 'analyzing' });
      triggerFeedback('error');
      setCapturedImage(null);
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
      setAiResult({ ...aiResult, ...values });
      setStep(3);
      triggerFeedback('success');
    } catch (error) {
      triggerFeedback('error');
    }
  };

  // 사이즈별 수량 증가
  const handleSizeIncrease = (size) => {
    triggerFeedback('click');
    setSizeQuantities(prev => ({
      ...prev,
      [size]: (prev[size] || 0) + 1
    }));
  };

  // 사이즈별 수량 감소
  const handleSizeDecrease = (size) => {
    triggerFeedback('click');
    setSizeQuantities(prev => ({
      ...prev,
      [size]: Math.max(0, (prev[size] || 0) - 1)
    }));
  };

  // 사이즈별 수량 직접 입력
  const handleSizeQuantityChange = (size, value) => {
    setSizeQuantities(prev => ({
      ...prev,
      [size]: Math.max(0, value || 0)
    }));
  };

  // 단순 수량 증가
  const handleSimpleIncrease = () => {
    triggerFeedback('click');
    setSimpleQuantity(prev => prev + 1);
  };

  // 단순 수량 감소
  const handleSimpleDecrease = () => {
    triggerFeedback('click');
    setSimpleQuantity(prev => Math.max(0, prev - 1));
  };

  // 입고/출고 처리
  const handleSubmit = () => {
    const hasSizes = aiResult?.sizes && aiResult.sizes.length > 0;
    
    let totalQuantity = 0;
    if (hasSizes) {
      totalQuantity = Object.values(sizeQuantities).reduce((sum, qty) => sum + qty, 0);
    } else {
      totalQuantity = simpleQuantity;
    }

    if (totalQuantity === 0) {
      message.warning('수량을 입력해주세요');
      triggerFeedback('error');
      return;
    }

    Modal.confirm({
      title: mode === 'inbound' ? '입고 처리 확인' : '출고 처리 확인',
      content: (
        <div style={{ padding: '12px 0' }}>
          <p style={{ marginBottom: 8 }}><strong>품번:</strong> {aiResult.itemCode}</p>
          <p style={{ marginBottom: 8 }}><strong>상품명:</strong> {aiResult.itemName}</p>
          {hasSizes ? (
            <div>
              <p style={{ marginBottom: 8 }}><strong>사이즈별 수량:</strong></p>
              <ul style={{ paddingLeft: 20, marginBottom: 8 }}>
                {Object.entries(sizeQuantities).map(([size, qty]) => (
                  qty > 0 && <li key={size}>{size}: {qty}개</li>
                ))}
              </ul>
            </div>
          ) : (
            <p style={{ marginBottom: 8 }}><strong>수량:</strong> {totalQuantity}개</p>
          )}
          <p style={{ marginBottom: 0 }}><strong>총 수량:</strong> {totalQuantity}개</p>
        </div>
      ),
      okText: '확인',
      cancelText: '취소',
      onOk: () => {
        message.success(`✅ ${mode === 'inbound' ? '입고' : '출고'} 처리 완료`);
        triggerFeedback('success');
        handleRescan();
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
    setSimpleQuantity(0);
    form.resetFields();
  };

  // 바코드 검색
  const handleBarcodeSearch = () => {
    if (!barcode.trim()) {
      message.warning('바코드를 입력하세요');
      return;
    }
    message.info('바코드 검색 기능 (준비 중)');
    setBarcodeModalVisible(false);
    setBarcode('');
  };

  const modeText = mode === 'inbound' ? '입고' : '출고';
  const modeColor = mode === 'inbound' ? '#52c41a' : '#ff4d4f';

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
              style={{ 
                backgroundColor: aiResult.confidence >= 0.9 ? '#52c41a' : '#faad14',
                fontSize: 12,
                fontWeight: 600
              }}
            />
          </div>

          <Form form={form} layout="vertical" className="result-form">
            {aiResult.brand && (
              <Form.Item label="브랜드" name="brand">
                <Input size="large" placeholder="브랜드 입력" />
              </Form.Item>
            )}

            <Form.Item label="품번" name="itemCode" rules={[{ required: true }]}>
              <Input size="large" placeholder="품번 입력" />
            </Form.Item>

            <Form.Item label="상품명" name="itemName" rules={[{ required: true }]}>
              <Input size="large" placeholder="상품명 입력" />
            </Form.Item>

            <Form.Item label="공급가" name="price">
              <InputNumber 
                size="large" 
                style={{ width: '100%' }}
                formatter={value => `₩ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/₩\s?|(,*)/g, '')}
                placeholder="가격 입력"
              />
            </Form.Item>

            {aiResult.sizes && aiResult.sizes.length > 0 && (
              <div className="sizes-detected">
                <p className="sizes-label">🎯 AI가 추출한 사이즈 ({aiResult.sizes.length}개)</p>
                <div className="size-tags">
                  {aiResult.sizes.map(size => (
                    <span key={size} className="size-tag">{size}</span>
                  ))}
                </div>
              </div>
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

      {/* Step 3: 동적 수량 입력 */}
      {step === 3 && aiResult && (
        <Card className="quantity-card">
          <div className="product-info">
            <h3>{aiResult.itemName}</h3>
            <p className="item-code">품번: {aiResult.itemCode}</p>
            <Badge 
              count={modeText}
              style={{ 
                backgroundColor: modeColor,
                fontSize: 14,
                fontWeight: 600,
                marginTop: 8
              }}
            />
          </div>

          <Divider />

          {aiResult.sizes && aiResult.sizes.length > 0 ? (
            // 사이즈별 수량 입력 (동적 생성)
            <div className="size-quantity-section">
              <h4>사이즈 / 수량</h4>
              <p className="quantity-hint">엄지로 톡톡 눌러서 수량을 맞춰주세요</p>
              
              <div className="dynamic-size-list">
                {aiResult.sizes.map(size => (
                  <div key={size} className="size-quantity-item">
                    <div className="size-label">{size}</div>
                    <div className="quantity-controls">
                      <Button
                        type="default"
                        shape="circle"
                        icon={<MinusOutlined />}
                        size="large"
                        onClick={() => handleSizeDecrease(size)}
                        disabled={sizeQuantities[size] === 0}
                        className="qty-btn minus-btn"
                      />
                      <InputNumber
                        value={sizeQuantities[size] || 0}
                        onChange={(value) => handleSizeQuantityChange(size, value)}
                        min={0}
                        size="large"
                        className="qty-input"
                        controls={false}
                      />
                      <Button
                        type="primary"
                        shape="circle"
                        icon={<PlusOutlined />}
                        size="large"
                        onClick={() => handleSizeIncrease(size)}
                        className="qty-btn plus-btn"
                        style={{ backgroundColor: modeColor, borderColor: modeColor }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="total-quantity">
                <span>총 수량:</span>
                <span className="total-number" style={{ color: modeColor }}>
                  {Object.values(sizeQuantities).reduce((sum, qty) => sum + qty, 0)}개
                </span>
              </div>
            </div>
          ) : (
            // 단순 수량 입력
            <div className="simple-quantity-section">
              <h4>동록 수량</h4>
              <div className="simple-quantity-controls">
                <Button
                  type="default"
                  shape="circle"
                  icon={<MinusOutlined />}
                  size="large"
                  onClick={handleSimpleDecrease}
                  disabled={simpleQuantity === 0}
                  className="simple-qty-btn"
                  style={{ width: 64, height: 64, fontSize: 24 }}
                />
                <div className="simple-qty-display" style={{ color: modeColor }}>
                  {simpleQuantity}
                </div>
                <Button
                  type="primary"
                  shape="circle"
                  icon={<PlusOutlined />}
                  size="large"
                  onClick={handleSimpleIncrease}
                  className="simple-qty-btn"
                  style={{ 
                    width: 64, 
                    height: 64, 
                    fontSize: 24,
                    backgroundColor: modeColor,
                    borderColor: modeColor
                  }}
                />
              </div>
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
              style={{ backgroundColor: modeColor, borderColor: modeColor }}
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
