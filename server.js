const http = require("http");
const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("Gemini API key is not set. Please check your .env file.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/") {
    fs.readFile(path.join(__dirname, "index.html"), (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end("Error loading index.html");
      } else {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(content);
      }
    });
  } else if (req.method === "POST" && req.url === "/generate-recipe") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", async () => {
      try {
        const { ingredients, cookStyle } = JSON.parse(body);

        if (!ingredients || ingredients.length === 0) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "재료를 입력해주세요." }));
          return;
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

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ recipe }));
      } catch (error) {
        console.error("Error generating recipe:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ error: "레시피 생성 중 오류가 발생했습니다." })
        );
      }
    });
  } else {
    res.writeHead(404);
    res.end("Not Found");
  }
});

const port = 3000;
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
