import { GoogleGenerativeAI } from '@google/generative-ai';
import { RawParsedRow } from '../normalizer';
import { RDNInstitution, RDNStatementType } from '../../../types/rdn-pipeline';

export interface LLMParseResult {
  institution: RDNInstitution;
  statementType: RDNStatementType;
  openingBalance?: number;
  closingBalance?: number;
  rows: RawParsedRow[];
}

export class LLMParser {
  /**
   * Fallback parser using Gemini with strict structured JSON output
   */
  static async parseUnstructured(
    text: string,
    inferredInstitution: RDNInstitution,
    inferredType: RDNStatementType
  ): Promise<LLMParseResult> {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key is not configured for LLM parsing fallback.');
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
Extract all financial transactions from this Indonesian broker or RDN account statement text.
Output MUST be strict JSON only matching this schema:
{
  "institution": "STOCKBIT" | "BCA" | "JAGO" | "MANDIRI" | "PERMATA" | "AJAIB" | "IPOT" | "MIRAE" | "UNKNOWN",
  "statementType": "BANK_RDN_MUTATION" | "BROKER_TRADE_CONFIRMATION",
  "openingBalance": number,
  "closingBalance": number,
  "rows": [
    {
      "date": "YYYY-MM-DD",
      "settlementDate": "YYYY-MM-DD",
      "action": "BUY" | "SELL" | "DIVIDEND" | "TOPUP" | "WITHDRAWAL" | "FEE" | "TAX" | "INTEREST",
      "ticker": string, // e.g. "BBRI" or null if cash mutation
      "lot": number,    // null if cash mutation
      "price": number,  // null if cash mutation
      "grossAmount": number,
      "fee": number,
      "tax": number,
      "netAmount": number,
      "balance": number,
      "description": string
    }
  ]
}

Document Content:
"""
${text.slice(0, 8000)}
"""
`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const match = responseText.match(/\{[\s\S]*\}/);
      if (!match) {
        throw new Error('LLM did not return a valid JSON object.');
      }

      const parsed = JSON.parse(match[0]);
      return {
        institution: parsed.institution || inferredInstitution,
        statementType: parsed.statementType || inferredType,
        openingBalance: typeof parsed.openingBalance === 'number' ? parsed.openingBalance : undefined,
        closingBalance: typeof parsed.closingBalance === 'number' ? parsed.closingBalance : undefined,
        rows: Array.isArray(parsed.rows) ? parsed.rows : [],
      };
    } catch (e: any) {
      console.warn('LLM parsing error:', e);
      throw e;
    }
  }
}
