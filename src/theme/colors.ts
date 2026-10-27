// Strict Apple Modern Palette & Liquid Glass Tokens per DESIGN.md
export const Colors = {
  palette: {
    appleBg: '#F5F5F7',
    appleInk: '#1D1D1F',
    appleMuted: '#AAAAAA',
    appleBlue: '#007AFF',
  },
  lightGlass: {
    background: '#F5F5F7',
    cardGradient: [
      'rgba(255, 255, 255, 0.84)',
      'rgba(245, 245, 247, 0.50)',
      'rgba(255, 255, 255, 0.76)',
    ] as const,
    dropletClearGradient: [
      'rgba(255, 255, 255, 0.90)',
      'rgba(245, 245, 247, 0.46)',
      'rgba(255, 255, 255, 0.78)',
    ] as const,
    dropletAzureGradient: [
      'rgba(72, 162, 255, 0.95)',
      'rgba(0, 122, 255, 0.86)',
      'rgba(0, 102, 224, 0.94)',
    ] as const,
    dropletObsidianGradient: [
      'rgba(58, 58, 62, 0.92)',
      'rgba(29, 29, 31, 0.88)',
      'rgba(18, 18, 20, 0.95)',
    ] as const,
    specularTopHighlight: ['rgba(255, 255, 255, 0.92)', 'rgba(255, 255, 255, 0.0)'] as const,
    borderGlass: 'rgba(255, 255, 255, 0.92)',
    trackBg: 'rgba(228, 228, 234, 0.72)',
    shadowInk: 'rgba(29, 29, 31, 0.08)',
    shadowAzure: 'rgba(0, 122, 255, 0.35)',
  },
  darkGlass: {
    background: '#1D1D1F',
    cardGradient: [
      'rgba(46, 46, 50, 0.78)',
      'rgba(29, 29, 31, 0.62)',
      'rgba(42, 42, 46, 0.72)',
    ] as const,
    dropletClearGradient: [
      'rgba(50, 50, 56, 0.85)',
      'rgba(29, 29, 31, 0.60)',
      'rgba(45, 45, 50, 0.75)',
    ] as const,
    dropletAzureGradient: [
      'rgba(50, 140, 255, 0.95)',
      'rgba(0, 122, 255, 0.88)',
      'rgba(0, 95, 210, 0.95)',
    ] as const,
    dropletObsidianGradient: [
      'rgba(35, 35, 38, 0.95)',
      'rgba(20, 20, 22, 0.92)',
      'rgba(12, 12, 14, 0.98)',
    ] as const,
    specularTopHighlight: ['rgba(255, 255, 255, 0.45)', 'rgba(255, 255, 255, 0.0)'] as const,
    borderGlass: 'rgba(255, 255, 255, 0.16)',
    trackBg: 'rgba(255, 255, 255, 0.08)',
    shadowInk: 'rgba(0, 0, 0, 0.45)',
    shadowAzure: 'rgba(0, 122, 255, 0.50)',
  },
};
