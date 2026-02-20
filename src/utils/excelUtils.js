/**
 * 엑셀 파일 처리 유틸리티
 */
import * as XLSX from 'xlsx';

// 표준 엑셀 템플릿 생성
export const createExcelTemplate = () => {
  const template = [
    {
      '품번': 'ITEM001',
      '상품명': '나이키 에어맥스',
      '카테고리': '신발',
      '사이즈': '230,235,240,245,250,255,260,265,270,275,280',
      '현재고': 50,
      '안전재고': 10,
      '바코드': '8801234567890',
      '비고': '사이즈 있는 상품'
    },
    {
      '품번': 'ITEM002',
      '상품명': '생수 2L',
      '카테고리': '음료',
      '사이즈': '',
      '현재고': 100,
      '안전재고': 20,
      '바코드': '8801234567891',
      '비고': '사이즈 없는 상품'
    },
    {
      '품번': 'ITEM003',
      '상품명': '화장품 세트',
      '카테고리': '화장품',
      '사이즈': '',
      '현재고': 30,
      '안전재고': 5,
      '바코드': '8801234567892',
      '비고': '사이즈 없는 상품'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(template);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '재고 마스터');

  // 컬럼 너비 설정
  ws['!cols'] = [
    { wch: 12 }, // 품번
    { wch: 20 }, // 상품명
    { wch: 12 }, // 카테고리
    { wch: 40 }, // 사이즈
    { wch: 10 }, // 현재고
    { wch: 10 }, // 안전재고
    { wch: 18 }, // 바코드
    { wch: 20 }  // 비고
  ];

  return wb;
};

// 엑셀 템플릿 다운로드
export const downloadExcelTemplate = () => {
  const wb = createExcelTemplate();
  XLSX.writeFile(wb, '재고_마스터_템플릿.xlsx');
};

// 업로드된 엑셀 파일 파싱
export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // 데이터 정규화
        const normalizedData = jsonData.map(row => ({
          itemCode: row['품번'] || '',
          itemName: row['상품명'] || '',
          category: row['카테고리'] || '',
          sizes: row['사이즈'] ? row['사이즈'].toString().split(',').map(s => s.trim()) : [],
          currentStock: parseInt(row['현재고']) || 0,
          safetyStock: parseInt(row['안전재고']) || 0,
          barcode: row['바코드'] || '',
          notes: row['비고'] || ''
        }));

        resolve(normalizedData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

// 데이터를 엑셀로 내보내기
export const exportToExcel = (data, filename = '재고_데이터.xlsx') => {
  // 데이터를 엑셀 형식으로 변환
  const excelData = data.map(item => ({
    '품번': item.itemCode,
    '상품명': item.itemName,
    '카테고리': item.category,
    '사이즈': item.sizes.join(','),
    '현재고': item.currentStock,
    '안전재고': item.safetyStock,
    '바코드': item.barcode,
    '비고': item.notes
  }));

  const ws = XLSX.utils.json_to_sheet(excelData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '재고 데이터');

  XLSX.writeFile(wb, filename);
};
