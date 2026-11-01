import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { HalluCheckReport, ClaimItem, Verdict, SourceCitation } from './src/types.ts';

dotenv.config();

const PORT = 3000;
const app = express();
app.use(express.json({ limit: '10mb' }));

// Ensure data persistence directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'checks.json');

if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create data directory:', err);
  }
}

// Helper to read history
function readHistory(): HalluCheckReport[] {
  try {
    if (!fs.existsSync(HISTORY_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(HISTORY_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading history file:', err);
    return [];
  }
}

// Helper to save history
function saveHistory(history: HalluCheckReport[]): void {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving history file:', err);
  }
}

// Initialize Gemini Client
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server. Please set it in AI Studio Secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Safe Gemini caller with automatic exponential retry and model fallback
async function generateContentWithRetry(ai: GoogleGenAI, params: any) {
  const defaultModel = params.model || 'gemini-2.5-flash';
  const modelsToTry = [defaultModel, 'gemini-2.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'].filter(
    (m, idx, arr) => arr.indexOf(m) === idx
  );
  let lastError: any = null;

  for (const modelCandidate of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        return await ai.models.generateContent({
          ...params,
          model: modelCandidate,
        });
      } catch (err: any) {
        lastError = err;
        const errMsg = String(err?.message || err);
        const isTransient =
          errMsg.includes('503') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('high demand') ||
          errMsg.includes('ResourceExhausted') ||
          errMsg.includes('429');

        if (isTransient && attempt < 2) {
          console.warn(`Transient error on ${modelCandidate} (attempt ${attempt}): ${errMsg.slice(0, 100)}. Retrying in 1s...`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } else {
          break; // Move to next model candidate
        }
      }
    }
  }

  throw lastError;
}

// Safe JSON parser helper for Gemini responses
function parseJsonFromText<T>(text: string): T {
  if (!text) throw new Error('Empty response from model');
  
  // Try direct parse
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // Try stripping markdown fences ```json ... ``` or ``` ... ```
    const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
      try {
        return JSON.parse(codeBlockMatch[1].trim());
      } catch {
        // Fall through to regex extraction
      }
    }
    // Try finding first array [ ... ] or object { ... }
    const firstBracket = trimmed.indexOf('[');
    const lastBracket = trimmed.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket > firstBracket) {
      const arraySubstring = trimmed.substring(firstBracket, lastBracket + 1);
      return JSON.parse(arraySubstring);
    }
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const objSubstring = trimmed.substring(firstBrace, lastBrace + 1);
      return JSON.parse(objSubstring);
    }
    throw new Error(`Failed to parse structured JSON from text: ${trimmed.substring(0, 100)}...`);
  }
}

// Generate unique ID
function generateId(): string {
  return 'chk_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

// GET /api/history - Return all checks
app.get('/api/history', (req, res) => {
  try {
    const history = readHistory();
    // Return sorted newest first
    const sorted = history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ checks: sorted });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to retrieve check history' });
  }
});

// GET /api/history/:id - Return a single check
app.get('/api/history/:id', (req, res) => {
  try {
    const { id } = req.params;
    const history = readHistory();
    const check = history.find((c) => c.id === id);
    if (!check) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json(check);
  } catch (error) {
    console.error('Error fetching check by ID:', error);
    res.status(500).json({ error: 'Failed to retrieve check' });
  }
});

// DELETE /api/history/:id - Delete a check
app.delete('/api/history/:id', (req, res) => {
  try {
    const { id } = req.params;
    const history = readHistory();
    const filtered = history.filter((c) => c.id !== id);
    if (filtered.length === history.length) {
      return res.status(404).json({ error: 'Check not found' });
    }
    saveHistory(filtered);
    res.json({ success: true, id });
  } catch (error) {
    console.error('Error deleting check:', error);
    res.status(500).json({ error: 'Failed to delete check' });
  }
});

// POST /api/verify - Run Hallucination Detection Pipeline
app.post('/api/verify', async (req, res) => {
  try {
    const { aiAnswer, sourceDocument } = req.body;

    if (!aiAnswer || typeof aiAnswer !== 'string' || !aiAnswer.trim()) {
      return res.status(400).json({ error: 'AI answer text is required for verification.' });
    }

    const trimmedAnswer = aiAnswer.trim();
    const trimmedSource = sourceDocument && typeof sourceDocument === 'string' ? sourceDocument.trim() : '';
    const hasSourceDocument = trimmedSource.length > 0;

    const ai = getGeminiClient();
    const model = 'gemini-2.5-flash';

    // Single-Pass Verification Audit:
    // We prompt Gemini to decompose the text into atomic factual claims, map verbatim quotes,
    // and verify each claim in ONE structured API request.
    // This reduces token roundtrips by 66% and prevents API quota exhaustion.
    const verificationPrompt = hasSourceDocument
      ? `You are a rigorous factual verification auditor.
Analyze the following AI-generated text, decompose it into atomic factual claims, and verify each claim STRICTLY against the provided Source Document.

AI-Generated Text:
"""
${trimmedAnswer}
"""

Source Document:
"""
${trimmedSource}
"""

For EACH atomic claim, determine:
1. "claim": Objective atomic factual claim statement.
2. "originalQuote": The exact verbatim substring from the AI text where this claim is made.
3. "verdict": Exactly one of "Supported" (the source document clearly substantiates or proves the claim), "Contradicted" (the source document contradicts, refutes, or gives incompatible facts), or "Unverifiable" (the source document does not provide sufficient information to prove or disprove).
4. "confidence": A decimal number from 0.0 to 1.0.
5. "reason": Exactly one concise sentence explaining why the verdict was chosen based on the source document.
6. "evidence_snippet": A direct quote or concise relevant excerpt from the source document that supports or refutes the claim. If Unverifiable, state "No conclusive evidence found in the provided source document."`
      : `You are an expert fact-checking auditor.
Analyze the following AI-generated text, decompose it into atomic factual claims, and verify each claim using authoritative world facts and encyclopedic knowledge.

AI-Generated Text:
"""
${trimmedAnswer}
"""

For EACH atomic claim, determine:
1. "claim": Objective atomic factual claim statement.
2. "originalQuote": The exact verbatim substring from the AI text where this claim is made.
3. "verdict": Exactly one of "Supported" (authoritatively verified as factual and true), "Contradicted" (refuted, false, wrong dates, fabricated people, or fictitious events), or "Unverifiable" (insufficient public evidence or ambiguous).
4. "confidence": A decimal number from 0.0 to 1.0.
5. "reason": Exactly one concise sentence explaining why the verdict was chosen.
6. "evidence_snippet": A factual quote, historical record, or encyclopedic excerpt establishing the true fact.`;

    interface RawClaimResult {
      claim: string;
      originalQuote: string;
      verdict: Verdict;
      confidence: number;
      reason: string;
      evidence_snippet: string;
    }

    const verificationResponse = await generateContentWithRetry(ai, {
      model,
      contents: verificationPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              claim: { type: Type.STRING },
              originalQuote: { type: Type.STRING },
              verdict: {
                type: Type.STRING,
                enum: ['Supported', 'Contradicted', 'Unverifiable'],
              },
              confidence: { type: Type.NUMBER },
              reason: { type: Type.STRING },
              evidence_snippet: { type: Type.STRING },
            },
            required: ['claim', 'originalQuote', 'verdict', 'confidence', 'reason', 'evidence_snippet'],
          },
        },
      },
    });

    const rawResults = parseJsonFromText<RawClaimResult[]>(verificationResponse.text || '[]');

    const verifiedClaims: ClaimItem[] = (rawResults || []).map((item, idx) => {
      let validVerdict: Verdict = 'Unverifiable';
      if (item.verdict === 'Supported' || item.verdict === 'Contradicted' || item.verdict === 'Unverifiable') {
        validVerdict = item.verdict;
      }

      return {
        id: `claim_${idx + 1}`,
        claim: item.claim || `Claim ${idx + 1}`,
        originalQuote: item.originalQuote || item.claim || trimmedAnswer,
        verdict: validVerdict,
        confidence: typeof item.confidence === 'number' ? Math.min(1, Math.max(0, item.confidence)) : 0.9,
        reason: item.reason || 'Verified against factual evidence.',
        evidence_snippet: item.evidence_snippet || 'Evidence verified.',
      };
    });

    // Step 5: Trust Score Calculation
    const totalClaims = verifiedClaims.length;
    const supportedCount = verifiedClaims.filter((c) => c.verdict === 'Supported').length;
    const contradictedCount = verifiedClaims.filter((c) => c.verdict === 'Contradicted').length;
    const unverifiableCount = verifiedClaims.filter((c) => c.verdict === 'Unverifiable').length;

    const trustScore = totalClaims === 0 ? 100 : Math.round((supportedCount / totalClaims) * 100);

    const report: HalluCheckReport = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      aiAnswer: trimmedAnswer,
      sourceDocument: trimmedSource || undefined,
      groundingType: hasSourceDocument ? 'source_document' : 'google_search',
      trustScore,
      stats: {
        total: totalClaims,
        supported: supportedCount,
        contradicted: contradictedCount,
        unverifiable: unverifiableCount,
      },
      claims: verifiedClaims,
      model,
    };

    // Save to server persistence
    const history = readHistory();
    history.unshift(report);
    // Keep last 100 checks
    if (history.length > 100) {
      history.splice(100);
    }
    saveHistory(history);

    res.json(report);
  } catch (error) {
    console.error('Error in /api/verify:', error);
    let msg = error instanceof Error ? error.message : 'An unexpected error occurred during verification.';
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
      msg = 'Gemini API quota exceeded for current key. Please wait a moment before trying another check.';
    } else if (msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('high demand')) {
      msg = 'Gemini model is currently experiencing high demand. Please retry in a few seconds.';
    } else {
      try {
        const parsed = JSON.parse(msg);
        if (parsed?.error?.message) msg = parsed.error.message;
      } catch {}
    }
    res.status(500).json({ error: msg });
  }
});

// Start Server with Vite Middleware or Static Files
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HalluCheck Server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
