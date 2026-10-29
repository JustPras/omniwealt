// OmniWealth "Warm Titanium & Champagne Liquid Glass" Palette & Tokens per DESIGN_SYSTEM.md
export const Colors = {
  palette: {
    // Warm Carbon OLED & Smoked Basalt Canvas
    canvas: '#0A0A09',
    elevated: '#141412',
    surfaceHigh: '#20201D',
    surfaceHigher: '#2A2A28',

    // Text & Metals
    alabasterWhite: '#F5F3EF',
    naturalTitanium: '#A39E93',
    darkPewter: '#57534E',
    pewterMuted: '#78716C',

    // Signature Accents
    champagneGold: '#D4AF37', // Primary Brand / IDX Stocks / AI Active
    champagneGoldLight: '#E8CA65',
    champagneGoldDark: '#997E20',

    // Financial Signals & Asset Classes
    sovereignJade: '#2EBD85', // Gain / Profit / RDN / Verified
    terracottaRose: '#E15241', // Loss / Expense
    titaniumSilver: '#94A3B8', // Cash / Bank
    burnishedCopper: '#E07A5F', // Crypto

    // Legacy palette compat aliases (mapping to warm luxury palette)
    appleBg: '#0A0A09',
    appleInk: '#F5F3EF',
    appleMuted: '#A39E93',
    appleBlue: '#D4AF37', // Replaced with Champagne Gold
  },

  // Quartz Liquid Glass Tokens
  quartzGlass: {
    background: 'rgba(20, 20, 18, 0.72)',
    cardGradient: [
      'rgba(245, 243, 239, 0.05)',
      'rgba(245, 243, 239, 0.015)',
      'rgba(245, 243, 239, 0.035)',
    ] as const,
    bullionGradient: [
      'rgba(212, 175, 55, 0.12)',
      'rgba(20, 20, 18, 0.75)',
      'rgba(10, 10, 9, 0.85)',
    ] as const,
    dropletClearGradient: [
      'rgba(245, 243, 239, 0.14)',
      'rgba(245, 243, 239, 0.04)',
      'rgba(245, 243, 239, 0.09)',
    ] as const,
    dropletGoldGradient: [
      'rgba(232, 202, 101, 0.95)',
      'rgba(212, 175, 55, 0.88)',
      'rgba(175, 140, 30, 0.95)',
    ] as const,
    dropletObsidianGradient: [
      'rgba(32, 32, 29, 0.95)',
      'rgba(14, 14, 12, 0.98)',
      'rgba(20, 20, 18, 0.95)',
    ] as const,
    specularTopHighlight: [
      'rgba(212, 175, 55, 0.45)',
      'rgba(255, 255, 255, 0.0)',
    ] as const,
    borderQuartz: 'rgba(255, 255, 255, 0.12)',
    borderBullion: 'rgba(212, 175, 55, 0.38)',
    borderTitanium: 'rgba(163, 158, 147, 0.22)',
    dividerDashed: 'rgba(255, 255, 255, 0.10)',
    trackBg: 'rgba(10, 10, 9, 0.65)',
    shadowInk: 'rgba(0, 0, 0, 0.65)',
    shadowGold: 'rgba(212, 175, 55, 0.30)',
  },

  // Backwards-compatible glass namespaces
  lightGlass: {
    background: 'transparent',
    cardGradient: [
      'rgba(245, 243, 239, 0.08)',
      'rgba(245, 243, 239, 0.02)',
      'rgba(245, 243, 239, 0.04)',
    ] as const,
    dropletClearGradient: [
      'rgba(245, 243, 239, 0.16)',
      'rgba(245, 243, 239, 0.05)',
      'rgba(245, 243, 239, 0.10)',
    ] as const,
    dropletAzureGradient: [
      'rgba(232, 202, 101, 0.95)',
      'rgba(212, 175, 55, 0.88)',
      'rgba(175, 140, 30, 0.95)',
    ] as const,
    dropletObsidianGradient: [
      'rgba(32, 32, 29, 0.95)',
      'rgba(14, 14, 12, 0.98)',
      'rgba(20, 20, 18, 0.95)',
    ] as const,
    specularTopHighlight: ['rgba(212, 175, 55, 0.50)', 'rgba(255, 255, 255, 0.0)'] as const,
    borderGlass: 'rgba(212, 175, 55, 0.30)',
    trackBg: 'rgba(10, 10, 9, 0.55)',
    shadowInk: 'rgba(0, 0, 0, 0.55)',
    shadowAzure: 'rgba(212, 175, 55, 0.30)',
  },
  darkGlass: {
    background: 'transparent',
    cardGradient: [
      'rgba(245, 243, 239, 0.05)',
      'rgba(245, 243, 239, 0.015)',
      'rgba(245, 243, 239, 0.035)',
    ] as const,
    dropletClearGradient: [
      'rgba(245, 243, 239, 0.14)',
      'rgba(245, 243, 239, 0.04)',
      'rgba(245, 243, 239, 0.09)',
    ] as const,
    dropletAzureGradient: [
      'rgba(232, 202, 101, 0.95)',
      'rgba(212, 175, 55, 0.88)',
      'rgba(175, 140, 30, 0.95)',
    ] as const,
    dropletObsidianGradient: [
      'rgba(32, 32, 29, 0.95)',
      'rgba(14, 14, 12, 0.98)',
      'rgba(20, 20, 18, 0.95)',
    ] as const,
    specularTopHighlight: ['rgba(212, 175, 55, 0.40)', 'rgba(255, 255, 255, 0.0)'] as const,
    borderGlass: 'rgba(255, 255, 255, 0.12)',
    trackBg: 'rgba(10, 10, 9, 0.65)',
    shadowInk: 'rgba(0, 0, 0, 0.65)',
    shadowAzure: 'rgba(212, 175, 55, 0.30)',
  },
};
