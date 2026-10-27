// Strict Apple Modern Palette & Liquid Glass Tokens per DESIGN.md
export const Colors = {
  palette: {
    appleBg: '#F5F5F7',
    appleInk: '#0F172A', // Deep dark ink
    appleMuted: '#475569', // Slate 600
    appleBlue: '#007AFF',
  },
  lightGlass: {
    background: 'transparent',
    // 3% glass core fill with 85% specular rim (Mode Terang / Siang)
    cardGradient: [
      'rgba(255, 255, 255, 0.45)',
      'rgba(255, 255, 255, 0.12)',
      'rgba(255, 255, 255, 0.25)',
    ] as const,
    dropletClearGradient: [
      'rgba(255, 255, 255, 0.85)',
      'rgba(255, 255, 255, 0.40)',
      'rgba(255, 255, 255, 0.70)',
    ] as const,
    dropletAzureGradient: [
      'rgba(72, 162, 255, 0.95)',
      'rgba(0, 122, 255, 0.86)',
      'rgba(0, 102, 224, 0.94)',
    ] as const,
    dropletObsidianGradient: [
      'rgba(15, 23, 42, 0.95)',
      'rgba(2, 6, 23, 0.98)',
      'rgba(15, 23, 42, 0.95)',
    ] as const,
    specularTopHighlight: ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.0)'] as const,
    borderGlass: 'rgba(255, 255, 255, 0.85)',
    trackBg: 'rgba(255, 255, 255, 0.65)',
    shadowInk: 'rgba(0, 0, 0, 0.12)',
    shadowAzure: 'rgba(0, 122, 255, 0.35)',
  },
  darkGlass: {
    background: 'transparent',
    // 3% glass core fill with 70% specular rim (Mode Gelap / Malam)
    cardGradient: [
      'rgba(255, 255, 255, 0.09)',
      'rgba(255, 255, 255, 0.015)',
      'rgba(255, 255, 255, 0.054)',
    ] as const,
    dropletClearGradient: [
      'rgba(255, 255, 255, 0.15)',
      'rgba(255, 255, 255, 0.04)',
      'rgba(255, 255, 255, 0.10)',
    ] as const,
    dropletAzureGradient: [
      'rgba(50, 140, 255, 0.95)',
      'rgba(0, 122, 255, 0.88)',
      'rgba(0, 95, 210, 0.95)',
    ] as const,
    dropletObsidianGradient: [
      'rgba(35, 45, 60, 0.95)',
      'rgba(10, 15, 22, 0.98)',
      'rgba(15, 23, 42, 0.95)',
    ] as const,
    specularTopHighlight: ['rgba(255, 255, 255, 0.70)', 'rgba(255, 255, 255, 0.0)'] as const,
    borderGlass: 'rgba(255, 255, 255, 0.58)',
    trackBg: 'rgba(0, 0, 0, 0.45)',
    shadowInk: 'rgba(0, 0, 0, 0.55)',
    shadowAzure: 'rgba(0, 122, 255, 0.50)',
  },
};
