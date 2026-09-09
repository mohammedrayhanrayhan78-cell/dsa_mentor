import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-3.6-flash';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

function parseHintResponse(rawText) {
  if (!rawText) {
    throw new Error('Empty response from Gemini');
  }

  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  const payload = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);

  return {
    hint: String(payload.hint ?? '').trim(),
    pattern: String(payload.pattern ?? '').trim(),
  };
}

export async function getHint(problemText, hintLevel) {
  const level = Math.min(Math.max(Number(hintLevel) || 1, 1), 3);

  const prompt = `You are a DSA (data structures and algorithms) mentor.
Analyze this problem and respond with JSON only, no markdown, in this exact shape:
{"hint":"...","pattern":"..."}

Rules:
1. Identify the DSA pattern/category of the problem (e.g. sliding window, two pointers, DFS, BFS, binary search, DP, greedy, heap, graph, backtracking). Put that in "pattern".
2. Give a hint appropriate to hintLevel ${level}:
   - 1 = subtle nudge
   - 2 = bigger nudge
   - 3 = near-complete approach
3. Never provide full working code.

Problem:
${problemText}`;

  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      temperature: 0.4,
      responseMimeType: 'application/json',
    },
  });

  const result = await model.generateContent(prompt);
  const rawText = result.response.text()?.trim();

  return parseHintResponse(rawText);
}
