import fetch from 'node-fetch';

const GEMINI_API_KEY = 'AIzaSyDEEVrp8TQmxhS03NBBhl2bPgO4LB77Z3g';

async function listModels() {
  try {
    console.log('\n=== 📋 Gemini 사용 가능한 모델 목록 조회 ===\n');
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API 오류:', errorText);
      return;
    }
    
    const data = await response.json();
    
    console.log('✅ 사용 가능한 모델:\n');
    data.models.forEach((model) => {
      console.log(`📦 ${model.name}`);
      console.log(`   - Display Name: ${model.displayName}`);
      console.log(`   - Supported Methods: ${model.supportedGenerationMethods.join(', ')}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

listModels();
