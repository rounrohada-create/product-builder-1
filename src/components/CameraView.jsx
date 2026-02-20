/**
 * CameraView 컴포넌트
 * 카메라 스트리밍 및 이미지 업로드 UI
 */
import { useState, useRef } from 'react';
import { Card, Button, Space, Upload, message, Spin } from 'antd';
import { CameraOutlined, PictureOutlined, ReloadOutlined } from '@ant-design/icons';
import Webcam from 'react-webcam';
import { triggerFeedback } from '../utils/feedback';
import { analyzeImageWithGemini } from '../services/geminiService';

const CameraView = ({ onAnalysisComplete }) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const webcamRef = useRef(null);

  // 카메라 활성화/비활성화
  const toggleCamera = () => {
    triggerFeedback('click');
    setCameraActive(!cameraActive);
    setCapturedImage(null);
  };

  // 사진 촬영
  const capturePhoto = () => {
    triggerFeedback('click');
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
    
    // Base64를 File 객체로 변환
    fetch(imageSrc)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'captured.jpg', { type: 'image/jpeg' });
        handleImageAnalysis(file);
      });
  };

  // 사진 재촬영
  const retakePhoto = () => {
    triggerFeedback('click');
    setCapturedImage(null);
  };

  // 이미지 분석 처리
  const handleImageAnalysis = async (file) => {
    setAnalyzing(true);
    message.loading({ content: '🤖 AI가 이미지를 분석 중입니다...', key: 'analyzing', duration: 0 });

    try {
      const result = await analyzeImageWithGemini(file);
      
      message.success({ 
        content: '✅ AI 분석이 완료되었습니다!', 
        key: 'analyzing',
        duration: 2 
      });
      
      triggerFeedback('success');
      onAnalysisComplete(result);
    } catch (error) {
      console.error('분석 오류:', error);
      message.error({ 
        content: '❌ 분석 중 오류가 발생했습니다.', 
        key: 'analyzing',
        duration: 3 
      });
      triggerFeedback('error');
    } finally {
      setAnalyzing(false);
    }
  };

  // 파일 업로드 처리
  const handleFileUpload = ({ file }) => {
    triggerFeedback('click');
    if (file.type.startsWith('image/')) {
      setCapturedImage(URL.createObjectURL(file));
      handleImageAnalysis(file);
    } else {
      message.error('이미지 파일만 업로드 가능합니다.');
      triggerFeedback('error');
    }
  };

  return (
    <Card 
      title={
        <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
          📷 이미지 입력
        </div>
      }
      style={{ height: '100%' }}
      bodyStyle={{ 
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}
    >
      {/* 카메라 뷰 또는 캡처된 이미지 */}
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '4/3',
        backgroundColor: '#f0f0f0',
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {analyzing && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            flexDirection: 'column',
            gap: '16px'
          }}>
            <Spin size="large" />
            <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
              AI 분석 중...
            </div>
          </div>
        )}

        {capturedImage ? (
          <img 
            src={capturedImage} 
            alt="Captured" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover' 
            }} 
          />
        ) : cameraActive ? (
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              facingMode: 'environment'
            }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
            <CameraOutlined style={{ fontSize: '64px', marginBottom: '16px' }} />
            <div style={{ fontSize: '16px' }}>카메라를 활성화하거나 이미지를 업로드하세요</div>
          </div>
        )}
      </div>

      {/* 컨트롤 버튼 */}
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {!cameraActive && !capturedImage && (
          <>
            <Button
              type="primary"
              icon={<CameraOutlined />}
              size="large"
              block
              onClick={toggleCamera}
              style={{ 
                height: '56px',
                fontSize: '18px',
                fontWeight: 'bold'
              }}
            >
              카메라 활성화
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
                style={{ 
                  height: '56px',
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}
              >
                이미지 업로드
              </Button>
            </Upload>
          </>
        )}

        {cameraActive && !capturedImage && (
          <>
            <Button
              type="primary"
              icon={<CameraOutlined />}
              size="large"
              block
              onClick={capturePhoto}
              style={{ 
                height: '56px',
                fontSize: '18px',
                fontWeight: 'bold'
              }}
            >
              촬영하기
            </Button>
            <Button
              danger
              size="large"
              block
              onClick={toggleCamera}
              style={{ 
                height: '56px',
                fontSize: '18px',
                fontWeight: 'bold'
              }}
            >
              카메라 끄기
            </Button>
          </>
        )}

        {capturedImage && (
          <Button
            icon={<ReloadOutlined />}
            size="large"
            block
            onClick={retakePhoto}
            disabled={analyzing}
            style={{ 
              height: '56px',
              fontSize: '18px',
              fontWeight: 'bold'
            }}
          >
            다시 촬영
          </Button>
        )}
      </Space>
    </Card>
  );
};

export default CameraView;
