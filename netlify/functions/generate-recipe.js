const { GoogleGenerativeAI } = require("@google/generative-ai");

// 로컬 환경에서 .env 파일 사용
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

exports.handler = async (event, context) => {
  console.log(event);
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { ingredients, cookStyle } = JSON.parse(event.body);

    if (!ingredients || ingredients.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "재료를 입력해주세요." }),

      };
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `다음 재료를 사용하여 만들 수 있는 맛있고 특별한 ${cookStyle} 요리 레시피를 알려줘. 특별한 양념이 필요하다면 구매 추천도 함께 해줘.: ${ingredients.join(
      ", "
    )}. 레시피는 다음 형식으로 제공해주세요:

  1. 요리 이름
  2. 필요한 재료 목록
  3. 조리 방법 (단계별로)
  4. 조리 시간
  5. 난이도 (쉬움, 보통, 어려움)
  6. 추천 향신료`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const recipe = response.text();

    return {
      statusCode: 200,
      body: JSON.stringify({ recipe }),
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // CORS 설정
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    };
  } catch (error) {
    console.error("Error generating recipe:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "레시피 생성 중 오류가 발생했습니다." }),
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // CORS 설정
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    };
  }
};
