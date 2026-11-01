export type Verdict = 'Supported' | 'Contradicted' | 'Unverifiable';

export interface SourceCitation {
  title?: string;
  url: string;
}

export interface ClaimItem {
  id: string;
  claim: string;
  originalQuote: string;
  startOffset?: number;
  endOffset?: number;
  verdict: Verdict;
  confidence: number; // 0 to 1
  reason: string;
  evidence_snippet: string;
  sourceUrls?: SourceCitation[];
}

export interface CheckStats {
  total: number;
  supported: number;
  contradicted: number;
  unverifiable: number;
}

export interface HalluCheckReport {
  id: string;
  createdAt: string;
  aiAnswer: string;
  sourceDocument?: string;
  groundingType: 'source_document' | 'google_search';
  trustScore: number;
  stats: CheckStats;
  claims: ClaimItem[];
  model: string;
}

export interface VerifyRequestPayload {
  aiAnswer: string;
  sourceDocument?: string;
}
