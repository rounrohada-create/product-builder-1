import { useState, useEffect } from 'react';
import { Layout, ConfigProvider, message, Modal } from 'antd';
import koKR from 'antd/locale/ko_KR';
import AppHeader from './components/AppHeader';
import CameraView from './components/CameraView';
import AIDataEditor from './components/AIDataEditor';
import QuantityInput from './components/QuantityInput';
import BarcodeScanner from './components/BarcodeScanner';
import { downloadExcelTemplate, parseExcelFile } from './utils/excelUtils';
import { syncToGoogleSheet } from './services/googleSheetService';
import { triggerFeedback } from './utils/feedback';
import './App.css';

const { Content, Footer } = Layout;

function App() {
  // 작업 모드 (입고/출고/조회)
  const [mode, setMode] = useState('입고');
  
  // AI 분석 결과
  const [analysisResult, setAnalysisResult] = useState(null);
  
  // 확정된 데이터
  const [confirmedData, setConfirmedData] = useState(null);
  
  // 재고 마스터 데이터
  const [inventoryData, setInventoryData] = useState([]);
  
  // 바코드 스캐너 모달
  const [barcodeScannerVisible, setBarcodeScannerVisible] = useState(false);

  // 엑셀 템플릿 다운로드
  const handleDownloadTemplate = () => {
    try {
      downloadExcelTemplate();
      message.success('✅ 템플릿 다운로드 완료');
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
      
      // 구글 시트와 동기화
      await syncToGoogleSheet(data);
      
      message.success({ 
        content: `✅ ${data.length}개 품목 업로드 완료`, 
        key: 'upload' 
      });
      triggerFeedback('success');
    } catch (error) {
      console.error('엑셀 업로드 오류:', error);
      message.error({ content: '엑셀 업로드 실패', key: 'upload' });
      triggerFeedback('error');
    }
  };

  // 구글 시트 동기화
  const handleSync = async () => {
    try {
      message.loading({ content: '동기화 중...', key: 'sync' });
      await syncToGoogleSheet(inventoryData);
      message.success({ content: '✅ 동기화 완료', key: 'sync' });
      triggerFeedback('success');
    } catch (error) {
      message.error({ content: '동기화 실패', key: 'sync' });
      triggerFeedback('error');
    }
  };

  // AI 분석 완료 처리
  const handleAnalysisComplete = (result) => {
    setAnalysisResult(result);
    setConfirmedData(null);
  };

  // 데이터 확정 처리
  const handleDataConfirm = (data) => {
    setConfirmedData(data);
    message.success('✅ 데이터가 확정되었습니다. 수량을 입력해주세요.');
    triggerFeedback('success');
  };

  // 수량 입력 완료 처리
  const handleQuantitySubmit = (data) => {
    Modal.confirm({
      title: <div style={{ fontSize: '20px' }}>처리 확인</div>,
      content: (
        <div style={{ fontSize: '16px' }}>
          <p><strong>품번:</strong> {data.itemCode}</p>
          <p><strong>상품명:</strong> {data.itemName}</p>
          <p><strong>모드:</strong> {data.mode}</p>
          {data.quantities ? (
            <div>
              <strong>사이즈별 수량:</strong>
              <ul>
                {Object.entries(data.quantities).map(([size, qty]) => (
                  qty > 0 && <li key={size}>{size}: {qty}개</li>
                ))}
              </ul>
              <strong>총 수량:</strong> {data.totalQuantity}개
            </div>
          ) : (
            <p><strong>수량:</strong> {data.quantity}개</p>
          )}
        </div>
      ),
      okText: '확인',
      cancelText: '취소',
      width: 500,
      onOk: async () => {
        try {
          // TODO: 실제 재고 업데이트 API 호출
          await syncToGoogleSheet([data]);
          
          message.success({
            content: `✅ ${data.mode} 처리가 완료되었습니다`,
            duration: 3
          });
          triggerFeedback('success');
          
          // 상태 초기화
          setAnalysisResult(null);
          setConfirmedData(null);
        } catch (error) {
          message.error('처리 중 오류가 발생했습니다');
          triggerFeedback('error');
        }
      }
    });
  };

  // 바코드 스캔 결과 처리
  const handleBarcodeScanned = (data) => {
    setAnalysisResult(data);
    setConfirmedData(null);
    message.success('✅ 바코드로 상품을 찾았습니다');
    triggerFeedback('success');
  };

  // 바코드 연결
  const handleBarcodeLink = (data) => {
    setBarcodeScannerVisible(true);
  };

  return (
    <ConfigProvider
      locale={koKR}
      theme={{
        token: {
          colorPrimary: '#1890ff',
          fontSize: 16,
          controlHeight: 48,
        },
        components: {
          Button: {
            controlHeight: 48,
            fontSize: 16,
            controlHeightLG: 56,
            fontSizeLG: 18,
          },
          Input: {
            controlHeight: 48,
            fontSize: 16,
            controlHeightLG: 56,
            fontSizeLG: 18,
          },
          Table: {
            fontSize: 16,
            cellFontSize: 16,
          }
        }
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        {/* 헤더 */}
        <AppHeader
          mode={mode}
          onModeChange={setMode}
          onDownloadTemplate={handleDownloadTemplate}
          onUploadExcel={handleUploadExcel}
          onSync={handleSync}
        />

        {/* 메인 컨텐츠 */}
        <Content style={{ padding: '16px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '16px',
            maxWidth: '1400px',
            margin: '0 auto'
          }}>
            {/* 좌측: 카메라/이미지 업로드 */}
            <div style={{ minHeight: '400px' }}>
              <CameraView onAnalysisComplete={handleAnalysisComplete} />
            </div>

            {/* 우측: AI 데이터 편집 또는 수량 입력 */}
            <div style={{ minHeight: '400px' }}>
              {!confirmedData ? (
                <AIDataEditor
                  analysisResult={analysisResult}
                  onDataConfirm={handleDataConfirm}
                  onBarcodeLink={handleBarcodeLink}
                />
              ) : (
                <QuantityInput
                  itemData={confirmedData}
                  mode={mode}
                  onQuantitySubmit={handleQuantitySubmit}
                />
              )}
            </div>
          </div>
        </Content>

        {/* 푸터 */}
        <Footer style={{ 
          textAlign: 'center',
          padding: '16px',
          background: '#f0f2f5'
        }}>
          <div style={{ fontSize: '14px', color: '#666' }}>
            📦 AI 듀얼 재고 마스터 v1.0
          </div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
            Powered by Gemini 2.0 Flash & React & Ant Design
          </div>
        </Footer>

        {/* 바코드 스캐너 모달 */}
        <BarcodeScanner
          visible={barcodeScannerVisible}
          onClose={() => setBarcodeScannerVisible(false)}
          onBarcodeScanned={handleBarcodeScanned}
        />
      </Layout>
    </ConfigProvider>
  );
}

export default App;
