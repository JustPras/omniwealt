import pako from 'pako';

export class PDFExtractorService {
  /**
   * Extract raw and clean text streams directly from PDF binary buffer in memory
   * Zero-cloud, 100% offline client-side parser.
   */
  static extractTextFromBuffer(uint8Array: Uint8Array): string {
    let fullText = '';

    // Convert Uint8Array to latin1 string for regex structure inspection
    let str = '';
    for (let i = 0; i < uint8Array.length; i++) {
      str += String.fromCharCode(uint8Array[i]);
    }

    // PDF stream pattern
    const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
    let match: RegExpExecArray | null;

    while ((match = streamRegex.exec(str)) !== null) {
      const rawStr = match[1];
      const rawBytes = new Uint8Array(rawStr.length);
      for (let i = 0; i < rawStr.length; i++) {
        rawBytes[i] = rawStr.charCodeAt(i);
      }

      let content = '';
      try {
        const inflated = pako.inflate(rawBytes);
        let inflatedStr = '';
        for (let i = 0; i < inflated.length; i++) {
          inflatedStr += String.fromCharCode(inflated[i]);
        }
        content = inflatedStr;
      } catch {
        content = rawStr;
      }

      // 1. Hex encoded string: <48656c6c6f> Tj
      const hexRegex = /<([0-9A-Fa-f]+)>\s*Tj/g;
      let hm: RegExpExecArray | null;
      while ((hm = hexRegex.exec(content)) !== null) {
        const hex = hm[1];
        let decoded = '';
        for (let k = 0; k < hex.length; k += 2) {
          decoded += String.fromCharCode(parseInt(hex.substr(k, 2), 16));
        }
        fullText += decoded + ' ';
      }

      // 2. Standard string: (text) Tj
      const tjRegex = /\(([^)]+)\)\s*Tj/g;
      let m: RegExpExecArray | null;
      while ((m = tjRegex.exec(content)) !== null) {
        fullText += m[1] + ' ';
      }

      // 3. Array of strings: [(text) 10 (text2)] TJ
      const arrayRegex = /\[(.*?)\]\s*TJ/g;
      while ((m = arrayRegex.exec(content)) !== null) {
        const inner = m[1];
        const partRegex = /\(([^)]*)\)/g;
        let pm: RegExpExecArray | null;
        while ((pm = partRegex.exec(inner)) !== null) {
          fullText += pm[1];
        }
        fullText += ' ';
      }
    }

    // Clean null bytes (UTF-16BE encoding common in stock statements)
    const cleaned = fullText.replace(/\u0000/g, '');

    // Normalize font kerning spaced words (e.g., 'S T O C K B I T' -> 'STOCKBIT')
    const lines = cleaned.split(/\r?\n/);
    const normalizedLines = lines.map((line) => {
      const words = line.trim().split(/\s{2,}/);
      const cleanedWords = words.map((w) => {
        if (/^([^\s]\s)+[^\s]$/.test(w.trim())) {
          return w.replace(/\s+/g, '');
        }
        return w;
      });
      return cleanedWords.join(' ');
    });

    return normalizedLines.join('\n').trim();
  }

  /**
   * Extract text from local DocumentPicker asset (Works on Web & Native)
   */
  static async extractTextFromFile(file: {
    uri: string;
    name: string;
    file?: any;
    mimeType?: string;
  }): Promise<string> {
    try {
      let uint8Array: Uint8Array | null = null;
      const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';

      if (isWeb && file.file) {
        // Web: use File/Blob ArrayBuffer
        const buffer = await (file.file as Blob).arrayBuffer();
        uint8Array = new Uint8Array(buffer);
      } else if (isWeb) {
        // Web fallback using fetch
        const res = await fetch(file.uri);
        const buffer = await res.arrayBuffer();
        uint8Array = new Uint8Array(buffer);
      } else {
        // Native (Android / iOS): dynamically load expo-file-system
        try {
          const FileSystem = require('expo-file-system');
          const base64 = await FileSystem.readAsStringAsync(file.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          // Decode base64 to Uint8Array
          const binaryStr = typeof atob === 'function' ? atob(base64) : Buffer.from(base64, 'base64').toString('binary');
          uint8Array = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            uint8Array[i] = binaryStr.charCodeAt(i);
          }
        } catch (fsErr) {
          console.warn('Native FileSystem read fallback to fetch:', fsErr);
          const res = await fetch(file.uri);
          const blob = await res.blob();
          const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as ArrayBuffer);
            reader.onerror = reject;
            reader.readAsArrayBuffer(blob);
          });
          uint8Array = new Uint8Array(buffer);
        }
      }

      if (!uint8Array) return '';

      // If it's a PDF, extract via in-memory stream decompressor
      if (file.name.toLowerCase().endsWith('.pdf')) {
        const text = PDFExtractorService.extractTextFromBuffer(uint8Array);
        if (text.length > 20) {
          return text;
        }
      }

      // If it's a plain text or CSV file
      if (
        file.name.toLowerCase().endsWith('.txt') ||
        file.name.toLowerCase().endsWith('.csv')
      ) {
        let textContent = '';
        for (let i = 0; i < uint8Array.length; i++) {
          textContent += String.fromCharCode(uint8Array[i]);
        }
        return textContent;
      }

      return '';
    } catch (err: any) {
      console.warn('PDFExtractorService error:', err?.message || err);
      return '';
    }
  }
}
