import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-3.6-flash';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const BUSY_MESSAGE = 'AI is busy right now, please try again in a moment';
const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [1000, 2000, 4000];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isServiceUnavailable(error) {
  const message = String(error?.message ?? '');
  return (
    error?.status === 503 ||
    error?.statusCode === 503 ||
    /\b503\b/.test(message) ||
    /UNAVAILABLE|overloaded/i.test(message)
  );
}

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

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      const result = await model.generateContent(prompt);
      return parseHintResponse(result.response.text()?.trim());
    } catch (error) {
      const canRetry = isServiceUnavailable(error) && attempt < MAX_ATTEMPTS - 1;
      if (!canRetry) {
        if (isServiceUnavailable(error)) {
          throw new Error(BUSY_MESSAGE);
        }
        throw error;
      }

      await sleep(RETRY_DELAYS_MS[attempt]);
    }
  }

  throw new Error(BUSY_MESSAGE);
}
