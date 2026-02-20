import fetch from 'node-fetch';
import fs from 'fs';

const GEMINI_API_KEY = 'AIzaSyBFha3k7nn0lO-8fV-n-CFz-nzJrZWfO5I';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

// 이미지를 Base64로 변환
const imageBuffer = fs.readFileSync('/home/user/webapp/test-shoes.jpg');
const base64Image = imageBuffer.toString('base64');

const requestBody = {
  contents: [
    {
      parts: [
        {
          text: `당신은 Gemini 2.0 Flash의 강력한 Vision 기능을 사용하는 전문 재고 관리 AI입니다.
한국 매장의 재고 관리를 돕기 위해 상품 사진을 정밀 분석해야 합니다.

이 사진에는 나이키 신발 박스들이 보입니다. 
각 박스의 라벨을 정밀하게 읽어서 다음 정보를 추출해주세요:

1. 브랜드: 나이키인지 확인
2. 모델명/품번: 박스에 적힌 모델 코드
3. 사이즈: 보이는 모든 사이즈 (KR/CM 기준)
4. 색상: 박스 색상이나 라벨에 적힌 색상

응답은 JSON 형식으로:
{
  "brand": "나이키",
  "itemCode": "추출된 품번",
  "itemName": "나이키 + 모델명",
  "sizes": ["보이는 사이즈들"],
  "barcode": "보이면 추출",
  "color": "색상",
  "confidence": 0.95
}

정밀하게 분석해주세요.`
        },
        {
          inline_data: {
            mime_type: 'image/jpeg',
            data: base64Image
          }
        }
      ]
    }
  ],
  generationConfig: {
    temperature: 0.2,
    topK: 32,
    topP: 1,
    maxOutputTokens: 2048,
  }
};

console.log('🤖 Gemini API 호출 중...');

fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(requestBody)
})
.then(response => response.json())
.then(data => {
  console.log('📊 Gemini API 응답:');
  console.log(JSON.stringify(data, null, 2));
  
  if (data.candidates && data.candidates[0]) {
    const textResponse = data.candidates[0].content.parts[0].text;
    console.log('\n✅ AI 분석 결과:');
    console.log(textResponse);
  }
})
.catch(error => {
  console.error('❌ 오류:', error);
});
