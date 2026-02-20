/**
 * Gemini 2.0 Flash API 서비스
 * AI 이미지 분석을 통한 재고 정보 추출
 */

// Gemini API 설정
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

/**
 * 이미지를 Base64로 변환
 */
const imageToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Gemini API를 통한 이미지 분석
 * @param {File} imageFile - 분석할 이미지 파일
 * @returns {Promise} - 추출된 재고 정보
 */
export const analyzeImageWithGemini = async (imageFile) => {
  try {
    console.log('🤖 Gemini AI 이미지 분석 시작...');

    // 이미지를 Base64로 변환
    const base64Image = await imageToBase64(imageFile);

    // Gemini API 요청 페이로드
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `당신은 Gemini 2.0 Flash의 강력한 Vision 기능을 사용하는 전문 재고 관리 AI입니다.
한국 매장의 재고 관리를 돕기 위해 상품 사진을 정밀 분석해야 합니다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📸 고해상도 정밀 분석 지침
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. **바코드 정밀 스캔**
   - 바코드의 숫자를 하나하나 정확하게 읽어주세요
   - 8자리, 13자리 등 바코드 전체 숫자를 빠짐없이 추출
   - 흐릿하면 추측하지 말고 confidence를 낮춰주세요

2. **라벨 텍스트 정밀 스캔**
   - 상품명, 브랜드명, 품번을 정확히 읽어주세요
   - 영문/한글/숫자 모두 정밀하게 인식
   - 작은 글씨도 놓치지 마세요

3. **사이즈 정보 우선순위 (한국 매장 기준)**
   
   **신발/운동화 (최우선):**
   - KR/JP 사이즈 (cm 단위): 220, 225, 230, 235, 240, 245, 250, 255, 260, 265, 270, 275, 280, 285, 290
   - 이런 표기를 찾으세요: "225", "230mm", "240 KR", "250 (25.0cm)"
   - US/UK 사이즈는 무시하고 KR/CM 위주로만 추출!
   
   **의류 (알파벳):**
   - XS, S, M, L, XL, XXL, XXXL, FREE
   - 한글 표기: "소", "중", "대", "특대" → S, M, L, XL로 변환
   
   **의류 (숫자):**
   - 90, 95, 100, 105, 110, 115, 120
   - 바지 인치: 28, 29, 30, 31, 32, 33, 34, 36, 38
   
   **사이즈가 여러 개 보이는 경우:**
   - 모든 사이즈를 배열로 반환: ["225", "230", "235", "240", "245"]
   
   **사이즈가 하나도 보이지 않는 경우:**
   - 빈 배열 반환: []

4. **가격 정보 추출**
   - "공급가", "도매가", "원가", "판매가" 등의 가격 정보
   - 쉼표 제거하고 숫자만: 59000, 129000
   - 가격이 없으면 0

5. **신뢰도 판단**
   - 모든 정보가 선명하고 정확: 0.9 이상
   - 일부 정보가 흐릿함: 0.7~0.8
   - 대부분 흐릿하거나 불확실: 0.5 이하
   - **0.6 이하면 "재촬영 필요" 메시지 추가**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 JSON 응답 형식 (반드시 준수)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  "barcode": "정확히 읽은 바코드 숫자 (예: 8801234567890)",
  "brand": "브랜드명 (예: 나이키, 아디다스, 뉴발란스)",
  "itemCode": "품번/모델명 (예: DH7561-100, GX3605)",
  "itemName": "상품명 (브랜드 + 제품명, 예: 나이키 에어맥스 270)",
  "sizes": ["사이즈 배열 (KR/CM 우선, 예: 225, 230, 235 또는 S, M, L)"],
  "price": 가격숫자 (예: 159000, 없으면 0),
  "category": "신발|의류|잡화|음료|화장품|기타",
  "confidence": 0.95,
  "needRescan": false,
  "message": "분석 완료" 또는 "사진이 흐릿합니다. 다시 촬영해 주세요."
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 분석 예시
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**예시 1: 신발 박스**
이미지에 보이는 것:
- 바코드: 8801234567890
- 브랜드: NIKE
- 모델: DH7561-100
- 사이즈 라벨: 225 230 235 240 245 250 255 260 265 270
- 가격: 159,000원

→ 응답:
{
  "barcode": "8801234567890",
  "brand": "나이키",
  "itemCode": "DH7561-100",
  "itemName": "나이키 에어맥스 270",
  "sizes": ["225", "230", "235", "240", "245", "250", "255", "260", "265", "270"],
  "price": 159000,
  "category": "신발",
  "confidence": 0.95,
  "needRescan": false,
  "message": "분석 완료"
}

**예시 2: 의류 태그**
이미지에 보이는 것:
- 바코드: 8801234567891
- 브랜드: Uniqlo
- 사이즈: S M L XL XXL
- 가격: 29,900원

→ 응답:
{
  "barcode": "8801234567891",
  "brand": "유니클로",
  "itemCode": "UT-001",
  "itemName": "유니클로 라운드 티셔츠",
  "sizes": ["S", "M", "L", "XL", "XXL"],
  "price": 29900,
  "category": "의류",
  "confidence": 0.92,
  "needRescan": false,
  "message": "분석 완료"
}

**예시 3: 흐릿한 사진**
이미지가 흐릿하거나 텍스트가 불명확한 경우:

→ 응답:
{
  "barcode": "",
  "brand": "",
  "itemCode": "",
  "itemName": "",
  "sizes": [],
  "price": 0,
  "category": "기타",
  "confidence": 0.3,
  "needRescan": true,
  "message": "사진이 흐릿합니다. 조명을 밝게 하고 다시 촬영해 주세요."
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 이제 이미지를 분석해 주세요
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

위 지침을 엄격히 따라 JSON 형식으로만 응답해 주세요.
추측하지 말고, 보이는 것만 정확하게 추출하세요.
한국 매장이므로 KR/CM 사이즈를 최우선으로 추출하세요.`
            },
            {
              inline_data: {
                mime_type: imageFile.type,
                data: base64Image
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 1,
        maxOutputTokens: 2048,
      }
    };

    // API 호출 (실제 환경에서는 API 키 필요)
    if (!GEMINI_API_KEY) {
      console.warn('⚠️ Gemini API 키가 설정되지 않았습니다. Mock 데이터를 반환합니다.');
      return getMockAnalysisResult();
    }

    console.log('✅ Gemini API 키 확인됨:', GEMINI_API_KEY.substring(0, 10) + '...');
    console.log('📡 Gemini API 호출 시작...');

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API HTTP 오류:', response.status, errorText);
      throw new Error(`Gemini API 오류: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📊 Gemini API 원본 응답:', JSON.stringify(data, null, 2));

    // 응답에서 JSON 추출
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('❌ 응답 형식 오류:', data);
      throw new Error('Gemini API 응답 형식이 올바르지 않습니다.');
    }

    const textResponse = data.candidates[0].content.parts[0].text;
    console.log('📝 AI 텍스트 응답:', textResponse);
    
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const parsedResult = JSON.parse(jsonMatch[0]);
      console.log('✅ AI 분석 완료:', parsedResult);
      return parsedResult;
    } else {
      console.error('❌ JSON 추출 실패. 텍스트:', textResponse);
      throw new Error('JSON 형식의 응답을 찾을 수 없습니다.');
    }

  } catch (error) {
    console.error('❌ Gemini API 오류 상세:', error);
    console.error('❌ 오류 스택:', error.stack);
    // 오류 발생 시에도 에러를 다시 던져서 사용자가 알 수 있도록 함
    throw error;
  }
};

/**
 * Mock 분석 결과 (개발 및 테스트용)
 */
const getMockAnalysisResult = () => {
  const mockResults = [
    {
      barcode: '8801234567890',
      brand: '나이키',
      itemCode: 'DH7561-100',
      itemName: '나이키 에어맥스 270 블랙',
      sizes: ['225', '230', '235', '240', '245', '250', '255', '260', '265', '270', '275', '280'],
      price: 159000,
      category: '신발',
      confidence: 0.92,
      needRescan: false,
      message: '분석 완료'
    },
    {
      barcode: '8801234567891',
      brand: '아디다스',
      itemCode: 'GX3605',
      itemName: '아디다스 슈퍼스타 화이트',
      sizes: ['230', '235', '240', '245', '250', '255', '260', '265', '270'],
      price: 129000,
      category: '신발',
      confidence: 0.88,
      needRescan: false,
      message: '분석 완료'
    },
    {
      barcode: '8801234567892',
      brand: '뉴발란스',
      itemCode: 'ML574EGG',
      itemName: '뉴발란스 574 그레이',
      sizes: ['240', '245', '250', '255', '260', '265', '270', '275', '280', '285'],
      price: 119000,
      category: '신발',
      confidence: 0.90,
      needRescan: false,
      message: '분석 완료'
    },
    {
      barcode: '8801234567893',
      brand: '유니클로',
      itemCode: 'UT-001',
      itemName: '유니클로 라운드 티셔츠',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      price: 29000,
      category: '의류',
      confidence: 0.91,
      needRescan: false,
      message: '분석 완료'
    },
    {
      barcode: '8801234567894',
      brand: '리바이스',
      itemCode: '501-ORIGINAL',
      itemName: '리바이스 501 오리지널 청바지',
      sizes: ['28', '30', '32', '34', '36'],
      price: 89000,
      category: '의류',
      confidence: 0.89,
      needRescan: false,
      message: '분석 완료'
    },
    {
      barcode: '8801234567895',
      brand: '코카콜라',
      itemCode: 'COCA-355',
      itemName: '코카콜라 355ml',
      sizes: [],
      price: 1500,
      category: '음료',
      confidence: 0.95,
      needRescan: false,
      message: '분석 완료'
    },
    {
      barcode: '8801234567896',
      brand: '이니스프리',
      itemCode: 'GTS-200',
      itemName: '이니스프리 그린티 토너 200ml',
      sizes: [],
      price: 15000,
      category: '화장품',
      confidence: 0.93,
      needRescan: false,
      message: '분석 완료'
    }
  ];

  const randomResult = mockResults[Math.floor(Math.random() * mockResults.length)];
  console.log('🎭 Mock AI 분석 결과:', randomResult);
  
  return new Promise((resolve) => {
    setTimeout(() => resolve(randomResult), 1500);
  });
};

/**
 * 여러 이미지 일괄 분석
 */
export const analyzeBatchImages = async (imageFiles) => {
  const results = [];
  
  for (const file of imageFiles) {
    const result = await analyzeImageWithGemini(file);
    results.push(result);
  }
  
  return results;
};
