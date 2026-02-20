/**
 * Google Sheets API 연동 서비스
 * 실제 운영 시 백엔드 API 엔드포인트로 대체 필요
 */

// Mock 함수: 구글 시트와 동기화
export const syncToGoogleSheet = async (data) => {
  // TODO: 실제 구글 시트 API 연동
  console.log('🔄 구글 시트 동기화 시작:', data);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('✅ 구글 시트 동기화 완료');
      resolve({ success: true, message: '구글 시트 동기화 완료' });
    }, 1000);
  });
};

// Mock 함수: 구글 시트에서 데이터 가져오기
export const fetchFromGoogleSheet = async () => {
  // TODO: 실제 구글 시트 API 연동
  console.log('📥 구글 시트에서 데이터 가져오기');
  
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockData = [
        {
          itemCode: 'ITEM001',
          itemName: '나이키 에어맥스',
          category: '신발',
          sizes: ['230', '235', '240', '245', '250', '255', '260', '265', '270', '275', '280'],
          currentStock: 50,
          safetyStock: 10,
          barcode: '8801234567890',
          notes: '사이즈 있는 상품'
        },
        {
          itemCode: 'ITEM002',
          itemName: '생수 2L',
          category: '음료',
          sizes: [],
          currentStock: 100,
          safetyStock: 20,
          barcode: '8801234567891',
          notes: '사이즈 없는 상품'
        }
      ];
      
      console.log('✅ 구글 시트 데이터 로드 완료');
      resolve(mockData);
    }, 800);
  });
};

// Mock 함수: 특정 품번으로 재고 검색
export const searchInventoryByItemCode = async (itemCode) => {
  // TODO: 실제 API 연동
  console.log('🔍 품번 검색:', itemCode);
  
  const allData = await fetchFromGoogleSheet();
  const result = allData.find(item => item.itemCode === itemCode);
  
  return result || null;
};

// Mock 함수: 바코드로 재고 검색
export const searchInventoryByBarcode = async (barcode) => {
  // TODO: 실제 API 연동
  console.log('🔍 바코드 검색:', barcode);
  
  const allData = await fetchFromGoogleSheet();
  const result = allData.find(item => item.barcode === barcode);
  
  return result || null;
};
