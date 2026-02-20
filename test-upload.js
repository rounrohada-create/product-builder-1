import fetch from 'node-fetch';
import fs from 'fs';

const GEMINI_API_KEY = 'AIzaSyDEEVrp8TQmxhS03NBBhl2bPgO4LB77Z3g';
// gemini-2.5-flash: 최신 모델, 빠르고 정확한 이미지 분석
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// 이미지를 base64로 변환
function imageToBase64(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  return imageBuffer.toString('base64');
}

async function analyzeImage() {
  try {
    console.log('\n=== 🚀 Gemini API 호출 시작 ===\n');
    
    const base64Image = imageToBase64('./test-shoes.jpg');
    console.log('✅ 이미지 Base64 변환 완료 (길이:', base64Image.length, 'bytes)\n');
    
    const requestBody = {
      contents: [{
        parts: [
          {
            text: `너는 한국 매장에서 사용하는 재고관리 AI야. 사진을 정밀 분석해서 **정확한 정보만** JSON으로 추출해줘.

🔍 **분석 방법**:
1. **바코드 숫자**: 8자리 또는 13자리 바코드를 한 글자씩 읽어서 확인해.
2. **브랜드**: 박스나 라벨에 가장 크게 적힌 브랜드명을 찾아.
3. **품번**: 영문+숫자 조합의 모델 코드 (예: DH7561-100, FZ5922).
4. **상품명**: 제품의 정식 명칭 (예: "나이키 에어맥스 270 블랙").
5. **사이즈 추출 (매우 중요!)**: 
   - 신발: **한국/일본 사이즈만** 추출 (225, 230, 235, 240... 최대 290)
     • "240 KR", "25.0cm", "260mm" → ["240", "250", "260"]으로 변환
     • US, UK, EU 사이즈는 **무시**해.
   - 의류(알파벳): S, M, L, XL, XXL, XXXL, FREE
   - 의류(숫자/인치): 90-120, 28-38 사이즈
6. **가격**: 정가 표시가 있으면 추출 (숫자만, 단위 제거).

📋 **필수 JSON 형식**:
\`\`\`json
{
  "barcode": "8801234567890",
  "brand": "나이키",
  "itemCode": "DH7561-100",
  "itemName": "나이키 에어맥스 270 블랙",
  "sizes": ["225", "230", "235", "240", "245", "250", "255", "260", "265", "270"],
  "price": 159000,
  "category": "신발",
  "confidence": 0.95,
  "needRescan": false,
  "message": "분석 완료"
}
\`\`\`

⚠️ **절대 규칙**:
- 글자가 흐릿하거나 확신이 없으면 confidence를 낮춰.
- confidence < 0.6이면 needRescan: true, message: "사진이 흐려서 다시 촬영해 주세요"
- **잘못된 정보를 추측하지 마**. 확실한 정보만 JSON에 담아.
- 사이즈는 **반드시 문자열 배열**로 반환: ["225", "230", ...] (숫자 아님!)

이제 이 사진을 분석해줘:`
          },
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: base64Image
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 1,
        maxOutputTokens: 4096,
      }
    };
    
    console.log('📤 API 요청 전송 중...\n');
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('📥 응답 상태 코드:', response.status, response.statusText, '\n');
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API 오류 응답:\n', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ 원본 응답 데이터:\n', JSON.stringify(data, null, 2), '\n');
    
    // AI 텍스트 응답 추출
    const aiText = data.candidates[0]?.content?.parts[0]?.text || '';
    console.log('🤖 AI 텍스트 응답:\n', aiText, '\n');
    
    // JSON 추출 시도
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysisResult = JSON.parse(jsonMatch[0]);
      console.log('✅ 파싱된 분석 결과:\n', JSON.stringify(analysisResult, null, 2), '\n');
      
      // 사이즈 데이터 검증
      if (analysisResult.sizes && Array.isArray(analysisResult.sizes)) {
        console.log('✅ 사이즈 배열:', analysisResult.sizes);
        console.log('✅ 사이즈 개수:', analysisResult.sizes.length);
      } else {
        console.log('⚠️  사이즈 데이터 없음 또는 잘못된 형식');
      }
      
      return analysisResult;
    } else {
      console.error('❌ JSON 형식을 찾을 수 없습니다.');
      throw new Error('응답에서 JSON을 추출할 수 없습니다.');
    }
    
  } catch (error) {
    console.error('❌ 분석 실패:\n', error.message);
    throw error;
  }
}

// 실행
analyzeImage()
  .then(result => {
    console.log('\n=== ✅ 최종 결과 ===\n');
    console.log('브랜드:', result.brand);
    console.log('품번:', result.itemCode);
    console.log('상품명:', result.itemName);
    console.log('사이즈:', result.sizes);
    console.log('신뢰도:', (result.confidence * 100).toFixed(0) + '%');
    console.log('재촬영 필요:', result.needRescan ? 'YES' : 'NO');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n=== ❌ 실패 ===\n', error);
    process.exit(1);
  });
