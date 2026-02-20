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
              
추출해야 할 정보:
1. 품번 (제품 코드, 모델명)
2. 상품명 (제품명, 브랜드명 포함)
3. 수량 또는 현재고 (이미지에서 확인 가능한 경우)
4. 사이즈 정보 (있는 경우)
5. 바코드 (보이는 경우)

응답은 반드시 다음 JSON 형식으로만 제공해주세요:
{
  "itemCode": "추출된 품번",
  "itemName": "추출된 상품명",
  "currentStock": 추출된 수량 (숫자, 없으면 0),
  "sizes": ["사이즈1", "사이즈2"] (배열, 없으면 빈 배열),
  "barcode": "추출된 바코드" (없으면 빈 문자열),
  "confidence": 0.95 (추출 신뢰도, 0~1 사이)
}

이미지에서 정보를 찾을 수 없으면 해당 필드를 빈 값으로 설정하세요.`
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
      itemCode: 'ITEM001',
      itemName: '나이키 에어맥스 270',
      currentStock: 12,
      sizes: ['240', '245', '250', '255', '260'],
      barcode: '8801234567890',
      confidence: 0.92
    },
    {
      itemCode: 'ITEM002',
      itemName: '아디다스 슈퍼스타',
      currentStock: 8,
      sizes: ['235', '240', '245', '250'],
      barcode: '8801234567891',
      confidence: 0.88
    },
    {
      itemCode: 'ITEM003',
      itemName: '코카콜라 355ml',
      currentStock: 24,
      sizes: [],
      barcode: '8801234567892',
      confidence: 0.95
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
