import { RDNInstitution, RDNStatementType, StandardizedRDNRecord } from '../../types/rdn-pipeline';
import { RuleBasedParser, RuleBasedParseResult } from './parsers/rule-based-parser';
import { LLMParser } from './parsers/llm-parser';
import { RDNNormalizer } from './normalizer';

export interface ClassificationResult {
  institution: RDNInstitution;
  statementType: RDNStatementType;
  openingBalance?: number;
  closingBalance?: number;
  records: StandardizedRDNRecord[];
  parserUsed: 'RULE_BASED' | 'LLM_STRUCTURED';
}

export class SmartRouterService {
  /**
   * Classify institution from header text
   */
  static detectInstitution(headerText: string): RDNInstitution {
    const lower = headerText.toLowerCase();

    if (lower.includes('stockbit')) return 'STOCKBIT';
    if (lower.includes('ajaib')) return 'AJAIB';
    if (lower.includes('indopremier') || lower.includes('ipot')) return 'IPOT';
    if (lower.includes('mandiri')) return 'MANDIRI';
    if (lower.includes('bca') || lower.includes('klikbca')) return 'BCA';
    if (lower.includes('jago')) return 'JAGO';
    if (lower.includes('permata')) return 'PERMATA';
    if (lower.includes('mirae')) return 'MIRAE';

    return 'UNKNOWN';
  }

  /**
   * Classify statement type: BANK_RDN_MUTATION (T+2 cash) vs BROKER_TRADE_CONFIRMATION (T+0 execution)
   */
  static detectStatementType(headerText: string): RDNStatementType {
    const lower = headerText.toLowerCase();

    // Check Trade Confirmation triggers
    if (
      lower.includes('trade confirmation') ||
      lower.includes('konfirmasi transaksi') ||
      lower.includes('trade date') ||
      lower.includes('bukti transaksi')
    ) {
      return 'BROKER_TRADE_CONFIRMATION';
    }

    // Default or Cash mutation triggers
    if (
      lower.includes('statement of account') ||
      lower.includes('mutasi rekening') ||
      lower.includes('cash investor') ||
      lower.includes('rekening dana nasabah') ||
      lower.includes('saldo awal') ||
      lower.includes('saldo akhir')
    ) {
      return 'BANK_RDN_MUTATION';
    }

    return 'BANK_RDN_MUTATION';
  }

  /**
   * Hybrid Routing: Rule-Based first, LLM fallback if unknown or 0 rows
   */
  static async routeAndParse(
    documentText: string,
    accountId: string
  ): Promise<ClassificationResult> {
    const headerSnippet = documentText.slice(0, 1500);
    const institution = SmartRouterService.detectInstitution(headerSnippet);
    const statementType = SmartRouterService.detectStatementType(headerSnippet);

    let parseResult: RuleBasedParseResult | null = null;
    let parserUsed: 'RULE_BASED' | 'LLM_STRUCTURED' = 'RULE_BASED';

    // 1. Try Rule-Based Parser first if institution recognized or standard format
    try {
      if (statementType === 'BANK_RDN_MUTATION') {
        parseResult = RuleBasedParser.parseBankMutation(documentText, institution);
      } else {
        parseResult = RuleBasedParser.parseTradeConfirmation(documentText, institution);
      }
    } catch (e) {
      console.warn('Rule-based parser execution failed, switching to LLM fallback:', e);
      parseResult = null;
    }

    // 2. If Rule-Based produced 0 rows or institution is UNKNOWN, fallback to LLM
    if (!parseResult || parseResult.rows.length === 0) {
      try {
        const llmResult = await LLMParser.parseUnstructured(documentText, institution, statementType);
        if (llmResult && llmResult.rows.length > 0) {
          parseResult = llmResult;
          parserUsed = 'LLM_STRUCTURED';
        }
      } catch (llmErr) {
        console.warn('LLM fallback also failed or not configured:', llmErr);
      }
    }

    const rows = parseResult?.rows || [];
    const openingBalance = parseResult?.openingBalance;
    const closingBalance = parseResult?.closingBalance;

    // Normalize all rows into StandardizedRDNRecord with strict category and Decimal math
    const records: StandardizedRDNRecord[] = rows.map((r, idx) =>
      RDNNormalizer.normalizeRecord(r, accountId, idx)
    );

    return {
      institution,
      statementType,
      openingBalance,
      closingBalance,
      records,
      parserUsed,
    };
  }
}
