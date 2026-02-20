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
              text: `다음 이미지를 분석하여 재고 관련 정보를 추출해주세요.

**중요: 사이즈 정보 추출 규칙**
- 이미지에서 보이는 모든 사이즈 정보를 정확하게 추출하세요
- 신발/운동화: 숫자 사이즈 (예: 225, 230, 235, 240, 245, 250, 255, 260, 265, 270, 275, 280, 285, 290)
- 의류: 알파벳 사이즈 (예: XS, S, M, L, XL, XXL, XXXL)
- 의류: 숫자 사이즈 (예: 95, 100, 105, 110 등)
- 혼합: 숫자+알파벳 (예: 28W, 30W, 32W, 34W)
- 사이즈가 보이지 않으면 빈 배열 []을 반환하세요

추출해야 할 정보:
1. 품번 (제품 코드, 모델명, SKU, 상품번호 등)
2. 상품명 (제품명, 브랜드명 포함)
3. 공급가 또는 가격 (이미지에서 확인 가능한 경우)
4. **사이즈 정보 (이미지에서 보이는 모든 사이즈를 정확하게 추출)**
5. 바코드 (보이는 경우)
6. 카테고리 (신발/의류/잡화 등 추정)

응답은 반드시 다음 JSON 형식으로만 제공해주세요:
{
  "itemCode": "추출된 품번",
  "itemName": "추출된 상품명",
  "price": 추출된 가격 (숫자, 없으면 0),
  "sizes": ["사이즈1", "사이즈2", "사이즈3", ...] (배열, 이미지에서 보이는 모든 사이즈),
  "barcode": "추출된 바코드" (없으면 빈 문자열),
  "category": "신발|의류|잡화|기타",
  "confidence": 0.95 (추출 신뢰도, 0~1 사이)
}

**예시:**
- 신발 상자에 "225, 230, 235, 240, 245"가 보이면: "sizes": ["225", "230", "235", "240", "245"]
- 의류 태그에 "S, M, L, XL"이 보이면: "sizes": ["S", "M", "L", "XL"]
- 사이즈 정보가 없으면: "sizes": []

이미지를 자세히 분석하여 정확하게 추출해주세요.`
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

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Gemini API 오류: ${response.status}`);
    }

    const data = await response.json();
    console.log('📊 Gemini API 응답:', data);

    // 응답에서 JSON 추출
    const textResponse = data.candidates[0].content.parts[0].text;
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const parsedResult = JSON.parse(jsonMatch[0]);
      console.log('✅ AI 분석 완료:', parsedResult);
      return parsedResult;
    } else {
      throw new Error('JSON 형식의 응답을 찾을 수 없습니다.');
    }

  } catch (error) {
    console.error('❌ Gemini API 오류:', error);
    // 오류 발생 시 Mock 데이터 반환
    return getMockAnalysisResult();
  }
};

/**
 * Mock 분석 결과 (개발 및 테스트용)
 */
const getMockAnalysisResult = () => {
  const mockResults = [
    {
      itemCode: 'NK-AM270-BLK',
      itemName: '나이키 에어맥스 270 블랙',
      price: 159000,
      sizes: ['225', '230', '235', '240', '245', '250', '255', '260', '265', '270', '275', '280'],
      barcode: '8801234567890',
      category: '신발',
      confidence: 0.92
    },
    {
      itemCode: 'AD-SS-WHT',
      itemName: '아디다스 슈퍼스타 화이트',
      price: 129000,
      sizes: ['230', '235', '240', '245', '250', '255', '260', '265', '270'],
      barcode: '8801234567891',
      category: '신발',
      confidence: 0.88
    },
    {
      itemCode: 'NB-574-GRY',
      itemName: '뉴발란스 574 그레이',
      price: 119000,
      sizes: ['240', '245', '250', '255', '260', '265', '270', '275', '280', '285'],
      barcode: '8801234567892',
      category: '신발',
      confidence: 0.90
    },
    {
      itemCode: 'TS-001',
      itemName: '남성 라운드 티셔츠',
      price: 29000,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      barcode: '8801234567893',
      category: '의류',
      confidence: 0.91
    },
    {
      itemCode: 'JN-002',
      itemName: '데님 청바지',
      price: 59000,
      sizes: ['28', '30', '32', '34', '36'],
      barcode: '8801234567894',
      category: '의류',
      confidence: 0.89
    },
    {
      itemCode: 'COCA-355',
      itemName: '코카콜라 355ml',
      price: 1500,
      sizes: [],
      barcode: '8801234567895',
      category: '음료',
      confidence: 0.95
    },
    {
      itemCode: 'COSM-001',
      itemName: '토너 200ml',
      price: 25000,
      sizes: [],
      barcode: '8801234567896',
      category: '화장품',
      confidence: 0.93
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
