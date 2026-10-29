import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Icon } from '../../src/components/common/icon';
import { HeaderBar } from '../../src/components/layout/header-bar';
import { GlassCard } from '../../src/components/common/glass-card';
import { LiquidButton } from '../../src/components/common/liquid-button';
import { ScreenTransition } from '../../src/components/common/screen-transition';
import { AmbientBackground } from '../../src/components/common/ambient-background';
import { PrivacyValue } from '../../src/components/common/privacy-value';
import { LiquidSegmentControl } from '../../src/components/common/liquid-segment-control';
import { AccountModal } from '../../src/components/modals/account-modal';
import { CashMutationModal } from '../../src/components/modals/cash-mutation-modal';
import { CryptoWalletModal } from '../../src/components/modals/crypto-wallet-modal';
import { BankAutoSyncModal } from '../../src/components/modals/bank-auto-sync-modal';
import { BankStatementModal } from '../../src/components/modals/bank-statement-modal';
import { LiabilityModal } from '../../src/components/modals/liability-modal';
import { PayLiabilityModal } from '../../src/components/modals/pay-liability-modal';
import { CryptoWalletService } from '../../src/services/crypto-wallet-service';
import { useWealth } from '../../src/store/wealth-context';
import { formatIDR, formatDate } from '../../src/utils/format';
import { triggerHaptic } from '../../src/utils/haptics';
import { BankMutationResult, AccountType, Liability } from '../../src/types';
import { color, space, radius, shadow, useTheme, Colors } from '../../src/theme/tokens';

type TxFilter = 'ALL' | 'INCOME' | 'EXPENSE' | 'TRANSFER';

const PRESETS = [
  {
    id: 'p1',
    title: 'QRIS Kopi Kenangan',
    amount: 'Rp 48.500',
    text: 'Transaksi QRIS Rp 48.500 di Kopi Kenangan berhasil dari rekening BCA Tahapan',
  },
  {
    id: 'p2',
    title: 'Gaji Bulanan',
    amount: 'Rp 2.500.000',
    text: 'Transfer masuk BI-FAST Rp 2.500.000 dari PT Karya Digital ke Mandiri Livin',
  },
  {
    id: 'p3',
    title: 'Top Up RDN',
    amount: 'Rp 1.000.000',
    text: 'Top up RDN Stockbit BCA sebesar Rp 1.000.000 dari BCA Tahapan berhasil',
  },
];

export default function AccountsScreen() {
  const { width } = useWindowDimensions();
  const isSmall = width < 375;
  const theme = useTheme();

  const {
    accounts,
    totalCash,
    liabilities,
    totalLiabilities,
    transactions,
    applyMutationText,
    cryptoWallets,
    syncCryptoWallet,
    deleteCryptoWallet,
    notificationConfig,
    processIncomingNotification,
  } = useWealth();

  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [autoSyncModalVisible, setAutoSyncModalVisible] = useState(false);
  const [bankStatementModalVisible, setBankStatementModalVisible] = useState(false);
  const [liabilityModalVisible, setLiabilityModalVisible] = useState(false);
  const [selectedLiabilityForEdit, setSelectedLiabilityForEdit] = useState<Liability | null>(null);
  const [payLiabilityModalVisible, setPayLiabilityModalVisible] = useState(false);
  const [selectedLiabilityForPay, setSelectedLiabilityForPay] = useState<Liability | null>(null);
  const [syncingWalletId, setSyncingWalletId] = useState<string | null>(null);
  const [mutationModalVisible, setMutationModalVisible] = useState(false);
  const [activeAccountForMutation, setActiveAccountForMutation] = useState<string | undefined>(undefined);
  const [mutationType, setMutationType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');

  // Interactive filters
  const [selectedTxFilter, setSelectedTxFilter] = useState<TxFilter>('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'ALL' | 'BANK' | 'RDN' | 'E-WALLET' | 'CRYPTO' | 'LIABILITIES'>('ALL');

  // AI Parser state
  const [parserText, setParserText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseResult, setParseResult] = useState<BankMutationResult | null>(null);

  // Background Simulator state
  const [simulatedNotification, setSimulatedNotification] = useState<string | null>(null);

  // Group accounts by type: Bank, RDN, E-Wallet (memoized)
  const bankAccounts = useMemo(() => accounts.filter((a) => a.type === 'BANK'), [accounts]);
  const rdnAccounts = useMemo(() => accounts.filter((a) => a.type === 'RDN'), [accounts]);
  const ewalletAccounts = useMemo(() => accounts.filter((a) => a.type === 'E-WALLET'), [accounts]);

  const displayedAccounts = useMemo(() => {
    if (selectedCategoryFilter === 'ALL') return accounts;
    return accounts.filter((a) => a.type === selectedCategoryFilter);
  }, [accounts, selectedCategoryFilter]);

  const filteredTransactions = useMemo(() => {
    if (selectedTxFilter === 'ALL') return transactions;
    if (selectedTxFilter === 'TRANSFER') {
      return transactions.filter((tx) => tx.type === 'TRANSFER' || tx.isInternalTransfer);
    }
    return transactions.filter((tx) => tx.type === selectedTxFilter && !tx.isInternalTransfer);
  }, [transactions, selectedTxFilter]);

  const handleProcessMutation = async (customText?: string) => {
    const textToProcess = customText || parserText;
    if (!textToProcess.trim()) return;

    setIsProcessing(true);
    triggerHaptic('medium');

    try {
      const result = await applyMutationText(textToProcess);
      setParseResult(result);
      triggerHaptic('success');
      if (!customText) {
        setParserText('');
      }
    } catch {
      triggerHaptic('warning');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulateAndroidListener = async () => {
    triggerHaptic('medium');
    const merchants = ['Kopi Kenangan Senopati', 'Fore Coffee Grand Indonesia', 'Point Coffee Sudirman', 'FamilyMart Thamrin'];
    const randomAmount = Math.floor(Math.random() * 45000) + 25000;
    const randomMerchant = merchants[Math.floor(Math.random() * merchants.length)];
    const text = `Transaksi QRIS Rp ${randomAmount.toLocaleString('id-ID')} di ${randomMerchant} berhasil dari rekening BCA Tahapan`;

    setSimulatedNotification(text);
    await processIncomingNotification(text, 'bca');
  };

  const openMutationModal = (accId: string, type: 'INCOME' | 'EXPENSE') => {
    triggerHaptic('light');
    setActiveAccountForMutation(accId);
    setMutationType(type);
    setMutationModalVisible(true);
  };

  const renderVaultAccountCard = (acc: typeof accounts[0], index: number) => {
    const isRdn = acc.type === 'RDN';
    const isEwallet = acc.type === 'E-WALLET';
    const isBank = acc.type === 'BANK';

    const cornerIndex = `${String(index + 1).padStart(2, '0')} // ${acc.name.toUpperCase()}`;
    const maskedNumber = acc.accountNumber
      ? `•••• ${acc.accountNumber.slice(-4)}`
      : '•••• 8821';

    const subtitle = isBank
      ? 'Priority High-Yield Tier'
      : isRdn
      ? 'Bank Custody RDN Settlement'
      : 'QRIS & Digital Micro Liquidity';

    const rightLabel = isBank ? 'YIELD' : isRdn ? 'ROLE' : 'STATUS';
    const rightValue = isBank ? '2.1% p.a.' : isRdn ? 'Standing Balance' : 'QRIS Ready';

    const footerStatus = isBank
      ? 'Verified 2h ago'
      : isRdn
      ? 'IDX Trading Ready'
      : 'Daily Micro Liquidity Max';

    const footerActionLabel = isBank ? 'STATEMENT' : isRdn ? 'ALLOCATE' : 'DETAILS';

    return (
      <View key={acc.id} style={styles.vaultCard}>
        {/* Top Header Row */}
        <View style={styles.vaultCardHeader}>
          <Text style={styles.vaultCardIndexText}>{cornerIndex}</Text>
          <View style={styles.vaultCardMaskedBadge}>
            <Text style={styles.vaultCardMaskedText}>{maskedNumber}</Text>
          </View>
        </View>

        {/* Amount & Tier Row */}
        <View style={styles.vaultCardBodyRow}>
          <View style={styles.vaultCardLeftCol}>
            <Text style={styles.vaultCardSubtitle}>{subtitle}</Text>
            <View style={styles.vaultCardAmountGroup}>
              <Text style={styles.vaultCardCurrencySymbol}>Rp</Text>
              <PrivacyValue value={acc.balance} style={styles.vaultCardAmountValue} />
            </View>
          </View>

          <View style={styles.vaultCardRightCol}>
            <Text style={styles.vaultCardRightLabel}>{rightLabel}</Text>
            <Text style={styles.vaultCardRightValue}>{rightValue}</Text>
          </View>
        </View>

        {/* Footer Bar */}
        <View style={styles.vaultCardFooterBar}>
          <View style={styles.vaultCardFooterLeft}>
            <View style={styles.vaultCardFooterDot} />
            <Text style={styles.vaultCardFooterStatusText}>{footerStatus}</Text>
          </View>

          <View style={styles.vaultCardFooterActions}>
            <Pressable
              onPress={() => openMutationModal(acc.id, 'INCOME')}
              hitSlop={6}
              style={styles.actionPill}
            >
              <Text style={styles.actionPillIncome}>+ Masuk</Text>
            </Pressable>
            <Pressable
              onPress={() => openMutationModal(acc.id, 'EXPENSE')}
              hitSlop={6}
              style={styles.actionPill}
            >
              <Text style={styles.actionPillExpense}>− Keluar</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                triggerHaptic('light');
                setBankStatementModalVisible(true);
              }}
              hitSlop={6}
              style={styles.vaultCardActionLink}
            >
              <Text style={styles.vaultCardActionLinkText}>{footerActionLabel}</Text>
              <Icon name="ArrowRight" size={13} color={Colors.palette.champagneGold} />
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  const renderAccountGroupCard = (title: string, groupAccounts: typeof accounts, iconName: any) => {
    if (groupAccounts.length === 0) return null;

    return (
      <View style={styles.groupContainer} key={title}>
        <View style={styles.groupHeaderRow}>
          <Icon name={iconName} size={15} color={theme.textMuted} />
          <Text style={[styles.groupTitleText, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.groupCountText, { color: theme.textMuted }]}>({groupAccounts.length})</Text>
        </View>

        <GlassCard level="base" noPadding style={styles.groupCard}>
          {groupAccounts.map((acc, index) => {
            const isLast = index === groupAccounts.length - 1;
            return (
              <View key={acc.id}>
                <View style={styles.accountRow}>
                  <View style={styles.accountLeft}>
                    <Text style={[styles.accountName, { color: theme.text }]}>{acc.name}</Text>
                    <Text style={[styles.accountMeta, { color: theme.textMuted }]}>
                      {acc.accountNumber || 'Aktif'}
                    </Text>
                  </View>

                  <View style={styles.accountRight}>
                    <PrivacyValue value={acc.balance} style={[styles.accountBalanceText, { color: theme.text }]} />
                    <View style={styles.quickActionPillRow}>
                      <Pressable
                        onPress={() => openMutationModal(acc.id, 'INCOME')}
                        hitSlop={6}
                        style={styles.actionPill}
                      >
                        <Text style={styles.actionPillIncome}>+ Masuk</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => openMutationModal(acc.id, 'EXPENSE')}
                        hitSlop={6}
                        style={styles.actionPill}
                      >
                        <Text style={styles.actionPillExpense}>− Keluar</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
                {!isLast && <View style={styles.rowHairline} />}
              </View>
            );
          })}
        </GlassCard>
      </View>
    );
  };

  const renderCryptoWalletsGroupCard = () => {
    return (
      <View style={styles.groupContainer} key="Dompet Kripto Web3">
        <View style={styles.groupHeaderRow}>
          <Icon name="Wallet" size={15} color="#A78BFA" />
          <Text style={[styles.groupTitleText, { color: '#DDD6FE' }]}>Dompet Kripto Web3</Text>
          <Text style={styles.groupCountText}>({cryptoWallets.length})</Text>
          <Pressable
            onPress={() => {
              triggerHaptic('light');
              setWalletModalVisible(true);
            }}
            style={styles.addWeb3HeaderBtn}
            hitSlop={6}
          >
            <Icon name="Plus" size={12} color="#A78BFA" />
            <Text style={styles.addWeb3HeaderBtnText}>Hubungkan</Text>
          </Pressable>
        </View>

        <GlassCard level="base" noPadding style={styles.groupCard}>
          {cryptoWallets.length === 0 ? (
            <Pressable
              onPress={() => {
                triggerHaptic('medium');
                setWalletModalVisible(true);
              }}
              style={styles.emptyWeb3Row}
            >
              <View style={styles.web3RowIconCircle}>
                <Icon name="Link2" size={16} color="#A78BFA" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.emptyWeb3Title}>Hubungkan Dompet Web3</Text>
                <Text style={styles.emptyWeb3Subtitle}>
                  Auto-sync saldo on-chain EVM, Solana & Bitcoin
                </Text>
              </View>
              <Icon name="ChevronRight" size={16} color={color.textMuted} />
            </Pressable>
          ) : (
            cryptoWallets.map((wallet, index) => {
              const isLast = index === cryptoWallets.length - 1;
              const isThisSyncing = syncingWalletId === wallet.id;

              return (
                <View key={wallet.id}>
                  <View style={styles.accountRow}>
                    <View style={styles.accountLeft}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={styles.web3NetworkBadge}>
                          <Text style={styles.web3NetworkBadgeText}>{wallet.networkType}</Text>
                        </View>
                        <Text style={styles.accountName}>{wallet.name}</Text>
                      </View>
                      <Text style={styles.accountMeta}>
                        {CryptoWalletService.truncateAddress(wallet.address, 6, 4)} • {wallet.tokens.length} token
                      </Text>
                    </View>

                    <View style={styles.accountRight}>
                      <PrivacyValue value={wallet.balanceIdr} style={styles.accountBalanceText} />
                      <View style={styles.web3ActionRow}>
                        <Pressable
                          onPress={async () => {
                            setSyncingWalletId(wallet.id);
                            try {
                              await syncCryptoWallet(wallet.id);
                            } finally {
                              setSyncingWalletId(null);
                            }
                          }}
                          disabled={isThisSyncing}
                          hitSlop={6}
                          style={styles.web3SyncBtn}
                        >
                          <Icon
                            name="RefreshCw"
                            size={11}
                            color={isThisSyncing ? color.accent : color.gain}
                          />
                          <Text style={styles.web3SyncBtnText}>
                            {isThisSyncing ? 'Sync...' : 'Auto-Sync'}
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => deleteCryptoWallet(wallet.id)}
                          hitSlop={6}
                          style={styles.web3DeleteBtn}
                        >
                          <Icon name="Trash2" size={12} color={color.loss} />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                  {!isLast && <View style={styles.rowHairline} />}
                </View>
              );
            })
          )}
        </GlassCard>
      </View>
    );
  };

  const renderLiabilitiesGroupCard = () => {
    return (
      <View style={styles.groupContainer} key="liabilities-group">
        <View style={styles.groupHeaderRow}>
          <Icon name="CreditCard" size={15} color="#F87171" />
          <Text style={[styles.groupTitleText, { color: '#FCA5A5' }]}>Liabilitas & Tagihan</Text>
          <Text style={styles.groupCountText}>({liabilities.length})</Text>

          {totalLiabilities > 0 && (
            <View style={styles.totalDebtBadge}>
              <Text style={styles.totalDebtBadgeText}>
                -{formatIDR(totalLiabilities)}
              </Text>
            </View>
          )}

          <LiquidButton
            title="Tambah"
            icon="Plus"
            variant="obsidian"
            size="sm"
            onPress={() => {
              setSelectedLiabilityForEdit(null);
              setLiabilityModalVisible(true);
            }}
          />
        </View>

        <GlassCard level="base" noPadding style={styles.groupCard}>
          {liabilities.length === 0 ? (
            <Pressable
              onPress={() => {
                triggerHaptic('medium');
                setSelectedLiabilityForEdit(null);
                setLiabilityModalVisible(true);
              }}
              style={styles.emptyWeb3Row}
            >
              <View style={[styles.web3RowIconCircle, { backgroundColor: 'rgba(248, 113, 113, 0.16)' }]}>
                <Icon name="CreditCard" size={16} color="#F87171" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.emptyWeb3Title}>Catat Utang / Kartu Kredit</Text>
                <Text style={styles.emptyWeb3Subtitle}>
                  Pantau tagihan kartu kredit, Shopee PayLater & cicilan untuk Net Worth sejati
                </Text>
              </View>
              <Icon name="ChevronRight" size={16} color={color.textMuted} />
            </Pressable>
          ) : (
            liabilities.map((item, index) => {
              const isLast = index === liabilities.length - 1;
              const hasLimit = typeof item.creditLimit === 'number' && item.creditLimit > 0;
              const utilPercent = hasLimit
                ? Math.min(100, Math.round((item.outstandingAmount / item.creditLimit!) * 100))
                : 0;

              return (
                <View key={item.id}>
                  <Pressable
                    onPress={() => {
                      triggerHaptic('selection');
                      setSelectedLiabilityForEdit(item);
                      setLiabilityModalVisible(true);
                    }}
                    style={styles.accountRow}
                  >
                    <View style={styles.accountLeft}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={[styles.liabilityTypeBadge, { borderColor: item.color || '#F87171' }]}>
                          <Text style={[styles.liabilityTypeBadgeText, { color: item.color || '#F87171' }]}>
                            {item.type === 'CREDIT_CARD'
                              ? 'KARTU KREDIT'
                              : item.type === 'PAYLATER'
                              ? 'PAYLATER'
                              : item.type === 'LOAN'
                              ? 'CICILAN'
                              : 'LAINNYA'}
                          </Text>
                        </View>
                        <Text style={styles.accountName}>{item.name}</Text>
                      </View>

                      <View style={styles.liabilityMetaRow}>
                        {item.dueDate ? (
                          <Text style={styles.accountMeta}>
                            Jatuh tempo tgl {item.dueDate}
                          </Text>
                        ) : null}
                        {hasLimit ? (
                          <Text style={styles.utilizationText}>
                            • Terpakai {utilPercent}% ({formatIDR(item.creditLimit!)})
                          </Text>
                        ) : item.monthlyInstallment ? (
                          <Text style={styles.utilizationText}>
                            • Cicilan {formatIDR(item.monthlyInstallment)}/bln
                          </Text>
                        ) : null}
                      </View>

                      {hasLimit && (
                        <View style={styles.miniProgressTrack}>
                          <View
                            style={[
                              styles.miniProgressBar,
                              {
                                width: `${Math.max(4, utilPercent)}%`,
                                backgroundColor:
                                  utilPercent > 50 ? '#EF4444' : utilPercent > 30 ? '#F59E0B' : '#3B82F6',
                              },
                            ]}
                          />
                        </View>
                      )}
                    </View>

                    <View style={styles.liabilityRight}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                        <Text style={styles.liabilityMinus}>-</Text>
                        <PrivacyValue value={item.outstandingAmount} style={styles.liabilityAmount} />
                      </View>

                      {item.outstandingAmount > 0 && (
                        <LiquidButton
                          title="Bayar"
                          variant="azure"
                          size="sm"
                          onPress={() => {
                            setSelectedLiabilityForPay(item);
                            setPayLiabilityModalVisible(true);
                          }}
                        />
                      )}
                    </View>
                  </Pressable>
                  {!isLast && <View style={styles.rowHairline} />}
                </View>
              );
            })
          )}
        </GlassCard>
      </View>
    );
  };

  return (
    <ScreenTransition style={[styles.screenContainer, { backgroundColor: theme.canvas }]}>
      <AmbientBackground activeAssetClass="CASH" />
      <HeaderBar />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: isSmall ? space.md : space.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. EDITORIAL HEADER & OVERVIEW BLOCK */}
        <View style={styles.vaultHeaderBlock}>
          <View style={styles.vaultSubHeaderRow}>
            <Text style={styles.vaultSubHeaderLabel}>INSTITUTIONAL LEDGER</Text>
            <View style={styles.hsmSyncedPill}>
              <View style={styles.hsmSyncedDot} />
              <Text style={styles.hsmSyncedText}>HSM Synced</Text>
            </View>
          </View>
          <View style={styles.vaultTitleCol}>
            <Text style={styles.vaultTitle}>VAULT ACCOUNTS</Text>
            <Text style={styles.vaultSubtitle}>Connected Institutional &amp; Self-Custody Ledgers</Text>
          </View>
        </View>

        {/* 2. LIQUID CASH HIGHLIGHT SLAB (WARM TITANIUM METALLIC SLAB) */}
        <GlassCard level="bullion" style={styles.liquidCashSlab}>
          <View style={styles.liquidCashHeaderRow}>
            <Text style={styles.liquidCashLabel}>TOTAL AVAILABLE LIQUIDITY</Text>
            <Icon name="Landmark" size={18} color={Colors.palette.champagneGold} />
          </View>
          <View style={styles.liquidCashAmountRow}>
            <Text style={styles.liquidCashCurrency}>Rp</Text>
            <PrivacyValue value={totalCash} style={styles.liquidCashAmount} />
          </View>
          <View style={styles.liquidCashGuaranteeRow}>
            <Icon name="ShieldCheck" size={14} color={Colors.palette.sovereignJade} />
            <Text style={styles.liquidCashGuaranteeText}>100% Capital Guaranteed &amp; Immediate Settlement</Text>
          </View>
          {/* Decorative Warm Metallic Flare */}
          <View style={styles.metallicFlareCircle} />
        </GlassCard>

        {/* 3. FILTER PILLS ROW */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsContainer}
          style={styles.filterPillsScroll}
        >
          <Pressable
            onPress={() => {
              triggerHaptic('selection');
              setSelectedCategoryFilter('ALL');
            }}
            style={[
              styles.filterPill,
              selectedCategoryFilter === 'ALL' && styles.filterPillActive,
            ]}
          >
            {selectedCategoryFilter === 'ALL' && <View style={styles.filterPillActiveDot} />}
            <Text
              style={[
                styles.filterPillText,
                selectedCategoryFilter === 'ALL' && styles.filterPillTextActive,
              ]}
            >
              All ({accounts.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              triggerHaptic('selection');
              setSelectedCategoryFilter('BANK');
            }}
            style={[
              styles.filterPill,
              selectedCategoryFilter === 'BANK' && styles.filterPillActive,
            ]}
          >
            {selectedCategoryFilter === 'BANK' && <View style={styles.filterPillActiveDot} />}
            <Text
              style={[
                styles.filterPillText,
                selectedCategoryFilter === 'BANK' && styles.filterPillTextActive,
              ]}
            >
              Banks ({bankAccounts.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              triggerHaptic('selection');
              setSelectedCategoryFilter('RDN');
            }}
            style={[
              styles.filterPill,
              selectedCategoryFilter === 'RDN' && styles.filterPillActive,
            ]}
          >
            {selectedCategoryFilter === 'RDN' && <View style={styles.filterPillActiveDot} />}
            <Text
              style={[
                styles.filterPillText,
                selectedCategoryFilter === 'RDN' && styles.filterPillTextActive,
              ]}
            >
              RDN Cash ({rdnAccounts.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              triggerHaptic('selection');
              setSelectedCategoryFilter('E-WALLET');
            }}
            style={[
              styles.filterPill,
              selectedCategoryFilter === 'E-WALLET' && styles.filterPillActive,
            ]}
          >
            {selectedCategoryFilter === 'E-WALLET' && <View style={styles.filterPillActiveDot} />}
            <Text
              style={[
                styles.filterPillText,
                selectedCategoryFilter === 'E-WALLET' && styles.filterPillTextActive,
              ]}
            >
              E-Wallets ({ewalletAccounts.length})
            </Text>
          </Pressable>

          {cryptoWallets.length > 0 && (
            <Pressable
              onPress={() => {
                triggerHaptic('selection');
                setSelectedCategoryFilter('CRYPTO');
              }}
              style={[
                styles.filterPill,
                selectedCategoryFilter === 'CRYPTO' && styles.filterPillActive,
              ]}
            >
              {selectedCategoryFilter === 'CRYPTO' && <View style={styles.filterPillActiveDot} />}
              <Text
                style={[
                  styles.filterPillText,
                  selectedCategoryFilter === 'CRYPTO' && styles.filterPillTextActive,
                ]}
              >
                Web3 ({cryptoWallets.length})
              </Text>
            </Pressable>
          )}

          {liabilities.length > 0 && (
            <Pressable
              onPress={() => {
                triggerHaptic('selection');
                setSelectedCategoryFilter('LIABILITIES');
              }}
              style={[
                styles.filterPill,
                selectedCategoryFilter === 'LIABILITIES' && styles.filterPillActive,
              ]}
            >
              {selectedCategoryFilter === 'LIABILITIES' && <View style={styles.filterPillActiveDot} />}
              <Text
                style={[
                  styles.filterPillText,
                  selectedCategoryFilter === 'LIABILITIES' && styles.filterPillTextActive,
                ]}
              >
                Liabilities ({liabilities.length})
              </Text>
            </Pressable>
          )}
        </ScrollView>

        {/* 4. STACKED VAULT CARDS WITH CORNER INDICES */}
        {accounts.length === 0 && cryptoWallets.length === 0 && liabilities.length === 0 ? (
          <GlassCard level="base" style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Belum ada rekening kas atau tagihan</Text>
            <Text style={styles.emptyDesc}>
              Tambahkan rekening bank, rekening dana nasabah (RDN), dompet digital, kartu kredit, atau dompet Web3 untuk memantau kekayaan bersih sejati.
            </Text>
            <LiquidButton
              title="Tambah rekening pertama"
              icon="Plus"
              variant="azure"
              size="md"
              onPress={() => {
                setAccountModalVisible(true);
              }}
              style={{ marginTop: space.sm }}
            />
          </GlassCard>
        ) : (
          <View style={styles.vaultStackWrapper}>
            {(selectedCategoryFilter === 'ALL' || selectedCategoryFilter === 'BANK' || selectedCategoryFilter === 'RDN' || selectedCategoryFilter === 'E-WALLET') &&
              displayedAccounts.map((acc, index) => renderVaultAccountCard(acc, index))}

            {(selectedCategoryFilter === 'ALL' || selectedCategoryFilter === 'CRYPTO') &&
              renderCryptoWalletsGroupCard()}

            {(selectedCategoryFilter === 'ALL' || selectedCategoryFilter === 'LIABILITIES') &&
              renderLiabilitiesGroupCard()}
          </View>
        )}

        {/* VAULT SECURITY CERTIFICATION & SOVEREIGN ACTION STRIP */}
        <View style={styles.securitySealStrip}>
          <Icon name="Lock" size={16} color={Colors.palette.champagneGold} />
          <Text style={styles.securitySealText}>
            ENCRYPTED WITH HARDWARE KEYSTONE • SECURE ENCLAVE
          </Text>
        </View>

        <Pressable
          onPress={() => {
            triggerHaptic('medium');
            setAccountModalVisible(true);
          }}
          style={styles.sovereignActionBtn}
        >
          <Icon name="PlusCircle" size={20} color="#0A0A09" />
          <Text style={styles.sovereignActionBtnText}>+ Add Account / Connect Bank</Text>
        </Pressable>

        {/* 3. KOTAK TEMPEL MUTASI & AI PARSER */}
        <GlassCard level="base" style={styles.parserCard}>
          <View style={styles.parserHeader}>
            <Text style={[styles.sectionHeadline, { color: theme.text }]}>Tempel mutasi</Text>
            <View style={styles.aiTag}>
              <Text style={styles.aiTagText}>AI Parser</Text>
            </View>
          </View>

          <Text style={styles.parserSubtext}>
            Pilih preset instan atau tempel teks notifikasi transaksi bank:
          </Text>

          {/* Preset Chips (Inset surfaces) */}
          <View style={styles.presetRow}>
            {PRESETS.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => {
                  triggerHaptic('selection');
                  setParserText(p.text);
                  setParseResult(null);
                }}
                style={styles.presetChip}
              >
                <Text style={styles.presetTitle}>{p.title}</Text>
                <Text style={styles.presetAmount}>{p.amount}</Text>
              </Pressable>
            ))}
          </View>

          {/* Large Inset Input Area */}
          <TextInput
            style={styles.parserInput}
            placeholder="Ketik atau tempel teks mutasi bank di sini..."
            placeholderTextColor={color.textFaint}
            multiline
            numberOfLines={3}
            value={parserText}
            onChangeText={(t) => {
              setParserText(t);
              setParseResult(null);
            }}
          />

          {/* Parse Result Confirmation Row */}
          {parseResult && (
            <View style={styles.confirmationRow}>
              <View style={styles.confirmLeft}>
                <Text style={styles.confirmType}>
                  {parseResult.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}: {formatIDR(parseResult.amount)}
                </Text>
                <Text style={styles.confirmAccount}>
                  {parseResult.bankName} • {parseResult.category} ({parseResult.merchantOrSender || 'Berhasil'})
                </Text>
              </View>
              <Text style={styles.confirmTag}>Mutasi dicatat</Text>
            </View>
          )}

          {/* Action Button: Simpan Mutasi */}
          <LiquidButton
            title="Simpan mutasi"
            variant="azure"
            size="md"
            loading={isProcessing}
            disabled={isProcessing || !parserText.trim()}
            onPress={() => handleProcessMutation()}
            style={{ width: '100%', marginTop: space.sm }}
          />
        </GlassCard>

        {/* 4. AUTO-SYNC NOTIFIKASI BANK & E-WALLET (PILAR 1) */}
        <GlassCard level="base" style={styles.simulatorCard}>
          <View style={styles.simulatorHeader}>
            <View style={styles.autoSyncTitleRow}>
              <View style={styles.autoSyncIconCircle}>
                <Icon name="BellRing" size={16} color="#38BDF8" />
              </View>
              <View>
                <Text style={styles.simulatorTitle}>Auto-Sync Notifikasi Bank</Text>
                <Text style={styles.simulatorSubBadge}>
                  {notificationConfig.enabled
                    ? '● Aktif (Mendukung 9 Institusi)'
                    : '○ Nonaktif'}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => {
                triggerHaptic('selection');
                setAutoSyncModalVisible(true);
              }}
              style={styles.manageSyncHeaderBtn}
            >
              <Icon name="Settings" size={12} color="#38BDF8" />
              <Text style={styles.manageSyncHeaderBtnText}>Atur</Text>
            </Pressable>
          </View>

          <Text style={styles.simulatorDesc}>
            Menangkap notifikasi mutasi QRIS, transfer masuk BI-FAST, dan debit secara otomatis dari m-Banking dan e-Wallet tanpa input manual.
          </Text>

          {/* Quick Action Button Row */}
          <View style={styles.autoSyncActionRow}>
            <LiquidButton
              title="Kelola & Setup 1-Klik"
              icon="Sliders"
              variant="azure"
              size="sm"
              onPress={() => {
                setAutoSyncModalVisible(true);
              }}
              style={{ flex: 1 }}
            />

            <LiquidButton
              title="Uji QRIS"
              icon="Play"
              variant="clear"
              size="sm"
              onPress={() => {
                handleSimulateAndroidListener();
              }}
              style={{ flex: 1 }}
            />
          </View>
        </GlassCard>

        {/* 5. IMPORT REKENING KORAN BULANAN (PILAR 3) */}
        <GlassCard level="base" style={styles.statementCard}>
          <View style={styles.simulatorHeader}>
            <View style={styles.autoSyncTitleRow}>
              <View style={[styles.autoSyncIconCircle, { backgroundColor: 'rgba(167, 139, 250, 0.16)' }]}>
                <Icon name="FileText" size={16} color="#A78BFA" />
              </View>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.simulatorTitle}>Rekening Koran Bulanan</Text>
                  <View style={styles.pilar3Badge}>
                    <Text style={styles.pilar3BadgeText}>Pilar 3</Text>
                  </View>
                </View>
                <Text style={styles.simulatorSubBadge}>e-Statement PDF BCA, Mandiri & Jago</Text>
              </View>
            </View>

            <Pressable
              onPress={() => {
                triggerHaptic('selection');
                setBankStatementModalVisible(true);
              }}
              style={styles.manageStatementBtn}
            >
              <Icon name="UploadCloud" size={12} color="#A78BFA" />
              <Text style={styles.manageStatementBtnText}>Import</Text>
            </Pressable>
          </View>

          <Text style={styles.simulatorDesc}>
            Impor seluruh mutasi bulanan sekaligus dari file PDF rekening koran, lengkap dengan rekonsiliasi saldo awal vs akhir dan anti-duplikasi buku kas.
          </Text>

          <LiquidButton
            title="Buka Rekonsiliasi e-Statement"
            icon="FileText"
            variant="clear"
            size="md"
            onPress={() => {
              setBankStatementModalVisible(true);
            }}
            style={{ width: '100%', marginTop: space.sm }}
          />
        </GlassCard>

        {/* 6. RIWAYAT TRANSAKSI TERBARU (SINGLE CARD WITH ROWS SEPARATED BY HAIRLINE) */}
        <View style={styles.historyHeaderRow}>
          <Text style={[styles.sectionHeadline, { color: theme.text }]}>Riwayat mutasi</Text>

          {/* Mini Tx Filter */}
          <LiquidSegmentControl<TxFilter>
            items={[
              { key: 'ALL', label: 'Semua' },
              { key: 'INCOME', label: 'Masuk' },
              { key: 'EXPENSE', label: 'Keluar' },
              { key: 'TRANSFER', label: 'Transfer' },
            ]}
            activeKey={selectedTxFilter}
            onSelect={setSelectedTxFilter}
            style={[styles.txFilterGroup, { width: isSmall ? 220 : 250 }]}
            height={32}
            fontSize={11}
            compact
            hapticType="light"
          />
        </View>

        {filteredTransactions.length === 0 ? (
          <GlassCard level="base" style={styles.emptyCard}>
            <Text style={styles.emptyDesc}>Belum ada riwayat transaksi kas.</Text>
          </GlassCard>
        ) : (
          <GlassCard level="base" noPadding style={styles.txCard}>
            {filteredTransactions.slice(0, 10).map((tx, index) => {
              const isInc = tx.type === 'INCOME';
              const isTransfer = tx.type === 'TRANSFER' || tx.isInternalTransfer;
              const isLast = index === Math.min(filteredTransactions.length, 10) - 1;
              return (
                <View key={tx.id}>
                  <View style={styles.txRow}>
                    <View style={styles.txLeft}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {isTransfer && (
                          <View style={styles.transferTagBadge}>
                            <Text style={styles.transferTagText}>Transfer</Text>
                          </View>
                        )}
                        <Text style={styles.txDescription}>{tx.description}</Text>
                      </View>
                      <Text style={styles.txMeta}>
                        {formatDate(tx.transactionDate)} • {tx.accountName || 'Kas'}
                        {tx.destinationAccountName ? ` ➔ ${tx.destinationAccountName}` : ''}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.txAmountText,
                        isTransfer
                          ? styles.textTransfer
                          : isInc
                          ? styles.textGain
                          : styles.textLoss,
                      ]}
                    >
                      {isTransfer ? '⇄ ' : isInc ? '▲ +' : '▼ −'}
                      {formatIDR(Math.abs(tx.amount))}
                    </Text>
                  </View>
                  {!isLast && <View style={styles.rowHairline} />}
                </View>
              );
            })}
          </GlassCard>
        )}
      </ScrollView>

      {/* Modals */}
      <AccountModal
        visible={accountModalVisible}
        onClose={() => setAccountModalVisible(false)}
      />

      <CashMutationModal
        visible={mutationModalVisible}
        accountId={activeAccountForMutation}
        initialType={mutationType}
        onClose={() => {
          setMutationModalVisible(false);
          setActiveAccountForMutation(undefined);
        }}
      />

      <CryptoWalletModal
        visible={walletModalVisible}
        onClose={() => setWalletModalVisible(false)}
      />

      <BankAutoSyncModal
        visible={autoSyncModalVisible}
        onClose={() => setAutoSyncModalVisible(false)}
      />

      <BankStatementModal
        visible={bankStatementModalVisible}
        onClose={() => setBankStatementModalVisible(false)}
      />

      <LiabilityModal
        visible={liabilityModalVisible}
        onClose={() => setLiabilityModalVisible(false)}
        liability={selectedLiabilityForEdit}
      />

      <PayLiabilityModal
        visible={payLiabilityModalVisible}
        onClose={() => setPayLiabilityModalVisible(false)}
        liability={selectedLiabilityForPay}
      />
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({

  // Luxury Stitch Screen 4 Styles
  vaultHeaderBlock: {
    gap: 4,
    paddingTop: 4,
  },
  vaultSubHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vaultSubHeaderLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: Colors.palette.champagneGold,
    textTransform: 'uppercase',
  },
  hsmSyncedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2A2A28',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  hsmSyncedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#60E6AA',
  },
  hsmSyncedText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.palette.naturalTitanium,
  },
  vaultTitleCol: {
    marginTop: 4,
  },
  vaultTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.palette.alabasterWhite,
    letterSpacing: -0.5,
  },
  vaultSubtitle: {
    fontSize: 12,
    color: Colors.palette.darkPewter,
    marginTop: 2,
  },
  liquidCashSlab: {
    backgroundColor: '#1C1C1A',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    position: 'relative',
    overflow: 'hidden',
  },
  liquidCashHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liquidCashLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: Colors.palette.darkPewter,
    textTransform: 'uppercase',
  },
  liquidCashAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginVertical: 6,
  },
  liquidCashCurrency: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.palette.champagneGold,
  },
  liquidCashAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.palette.alabasterWhite,
    letterSpacing: -0.5,
  },
  liquidCashGuaranteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  liquidCashGuaranteeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#60E6AA',
  },
  metallicFlareCircle: {
    position: 'absolute',
    right: -30,
    bottom: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
  },
  filterPillsScroll: {
    marginVertical: 2,
  },
  filterPillsContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: '#20201D',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  filterPillActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.16)',
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  filterPillActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.palette.champagneGold,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.palette.naturalTitanium,
  },
  filterPillTextActive: {
    color: Colors.palette.champagneGold,
    fontWeight: '700',
  },
  vaultStackWrapper: {
    gap: 12,
  },
  vaultCard: {
    backgroundColor: '#1C1C1A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  vaultCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  vaultCardIndexText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    color: Colors.palette.champagneGold,
    textTransform: 'uppercase',
  },
  vaultCardMaskedBadge: {
    backgroundColor: '#2A2A28',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  vaultCardMaskedText: {
    fontSize: 11,
    color: Colors.palette.darkPewter,
  },
  vaultCardBodyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  vaultCardLeftCol: {
    flex: 1,
  },
  vaultCardSubtitle: {
    fontSize: 12,
    color: Colors.palette.darkPewter,
    marginBottom: 2,
  },
  vaultCardAmountGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  vaultCardCurrencySymbol: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.palette.naturalTitanium,
  },
  vaultCardAmountValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.palette.alabasterWhite,
  },
  vaultCardRightCol: {
    alignItems: 'flex-end',
  },
  vaultCardRightLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#60E6AA',
    textTransform: 'uppercase',
  },
  vaultCardRightValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.palette.alabasterWhite,
    marginTop: 1,
  },
  vaultCardFooterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#141412',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  vaultCardFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vaultCardFooterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#60E6AA',
  },
  vaultCardFooterStatusText: {
    fontSize: 11,
    color: Colors.palette.darkPewter,
  },
  vaultCardFooterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vaultCardActionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingLeft: 4,
  },
  vaultCardActionLinkText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.palette.champagneGold,
  },
  securitySealStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#141412',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  securitySealText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: Colors.palette.darkPewter,
    textTransform: 'uppercase',
  },
  sovereignActionBtn: {
    width: '100%',
    height: 52,
    borderRadius: 9999,
    backgroundColor: Colors.palette.champagneGold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sovereignActionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0A0A09',
    letterSpacing: 0.3,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: color.obsidian,
  },
  scrollContent: {
    paddingBottom: 110,
    gap: space.lg,
  },
  heroCard: {
    padding: space.lg,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLabel: {
    fontSize: 13,
    color: color.textMuted,
    fontWeight: '500',
    marginBottom: space.xs,
  },
  heroAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: color.text,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 12,
    color: color.textMuted,
    marginTop: space.xs,
  },
  addAccountButton: {
    backgroundColor: color.accent,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    ...shadow.e1,
  },
  addAccountButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: color.onAccent,
  },

  // Groups
  groupsWrapper: {
    gap: space.md,
  },
  groupContainer: {
    gap: space.xs,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  groupTitleText: {
    fontSize: 14,
    fontWeight: '600',
    color: color.text,
  },
  groupCountText: {
    fontSize: 12,
    color: color.textMuted,
  },
  groupCard: {
    borderRadius: radius.lg,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
  },
  accountLeft: {
    flex: 1,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '600',
    color: color.text,
  },
  accountMeta: {
    fontSize: 12,
    color: color.textMuted,
    marginTop: 2,
  },
  accountRight: {
    alignItems: 'flex-end',
  },
  accountBalanceText: {
    fontSize: 15,
    fontWeight: '700',
    color: color.text,
    textAlign: 'right',
  },
  quickActionPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    marginTop: 4,
  },
  actionPill: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
    backgroundColor: color.glassFillInset,
  },
  actionPillIncome: {
    fontSize: 11,
    color: color.gain,
    fontWeight: '600',
  },
  actionPillExpense: {
    fontSize: 11,
    color: color.loss,
    fontWeight: '600',
  },
  rowHairline: {
    height: 1,
    backgroundColor: color.hairline,
    marginHorizontal: space.lg,
  },

  // Parser Card
  parserCard: {
    padding: space.lg,
  },
  parserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.xs,
  },
  sectionHeadline: {
    fontSize: 17,
    fontWeight: '600',
    color: color.text,
  },
  aiTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: color.accentSoft,
    borderWidth: 1,
    borderColor: color.accentRim,
  },
  aiTagText: {
    fontSize: 11,
    color: color.accent,
    fontWeight: '600',
  },
  parserSubtext: {
    fontSize: 13,
    color: color.textMuted,
    marginBottom: space.md,
  },
  presetRow: {
    flexDirection: 'row',
    gap: space.xs + 2,
    marginBottom: space.md,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    backgroundColor: color.glassFillInset,
    borderWidth: 1,
    borderColor: color.hairline,
  },
  presetTitle: {
    fontSize: 11,
    color: color.textMuted,
    fontWeight: '500',
  },
  presetAmount: {
    fontSize: 12,
    color: color.text,
    fontWeight: '600',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  parserInput: {
    backgroundColor: color.glassFillInset,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.hairline,
    padding: space.md,
    color: color.text,
    fontSize: 14,
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: space.md,
  },
  confirmationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(16, 185, 129, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.22)',
    marginBottom: space.md,
  },
  confirmLeft: {
    flex: 1,
  },
  confirmType: {
    fontSize: 13,
    fontWeight: '600',
    color: color.gain,
  },
  confirmAccount: {
    fontSize: 11,
    color: color.textMuted,
    marginTop: 2,
  },
  confirmTag: {
    fontSize: 11,
    fontWeight: '600',
    color: color.gain,
  },
  saveMutationButton: {
    backgroundColor: color.accent,
    paddingVertical: 12,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.e1,
  },
  disabledButton: {
    opacity: 0.5,
  },
  saveMutationText: {
    fontSize: 13,
    fontWeight: '600',
    color: color.onAccent,
  },

  // Simulator Card
  simulatorCard: {
    padding: space.lg,
  },
  statementCard: {
    padding: space.lg,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.25)',
  },
  pilar3Badge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(167, 139, 250, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
  },
  pilar3BadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#A78BFA',
  },
  manageStatementBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(167, 139, 250, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.28)',
  },
  manageStatementBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#A78BFA',
  },
  openStatementBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#7C3AED',
    paddingVertical: 10,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    marginTop: space.xs,
  },
  openStatementBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  simulatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.xs,
  },
  autoSyncTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  autoSyncIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  simulatorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: color.text,
  },
  simulatorSubBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: color.gain,
    marginTop: 1,
  },
  manageSyncHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  manageSyncHeaderBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#38BDF8',
  },
  simulatorDesc: {
    fontSize: 11,
    color: color.textMuted,
    lineHeight: 16,
    marginVertical: space.xs,
  },
  autoSyncActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.xs,
  },
  openModalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingVertical: 9,
    borderRadius: radius.pill,
    ...shadow.e1,
  },
  openModalBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  quickTestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
  },
  quickTestBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#38BDF8',
  },

  // History
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  txFilterGroup: {
    alignSelf: 'center',
  },
  txFilterBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
  },
  txFilterBtnActive: {
    backgroundColor: color.accentSoft,
  },
  txFilterBtnText: {
    fontSize: 11,
    color: color.textMuted,
    fontWeight: '500',
  },
  txFilterBtnTextActive: {
    color: color.accent,
    fontWeight: '600',
  },
  txCard: {
    borderRadius: radius.lg,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
  },
  txLeft: {
    flex: 1,
  },
  txDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: color.text,
  },
  txMeta: {
    fontSize: 11,
    color: color.textMuted,
    marginTop: 2,
  },
  txAmountText: {
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  textGain: {
    color: color.gain,
  },
  textLoss: {
    color: color.loss,
  },
  textTransfer: {
    color: '#38BDF8',
  },
  transferTagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.28)',
  },
  transferTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#38BDF8',
  },
  emptyCard: {
    padding: space.lg,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: color.text,
    marginBottom: space.xs,
  },
  emptyDesc: {
    fontSize: 13,
    color: color.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: space.md,
  },

  // Web3 Group Styles
  addWeb3HeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    marginLeft: 'auto',
  },
  addWeb3HeaderBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DDD6FE',
  },
  emptyWeb3Row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space.md,
    gap: space.md,
  },
  web3RowIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWeb3Title: {
    fontSize: 13,
    fontWeight: '600',
    color: color.text,
    marginBottom: 2,
  },
  emptyWeb3Subtitle: {
    fontSize: 11,
    color: color.textMuted,
  },
  web3NetworkBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  web3NetworkBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#DDD6FE',
  },
  web3ActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  web3SyncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  web3SyncBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: color.gain,
  },
  web3DeleteBtn: {
    padding: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  totalDebtBadge: {
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  totalDebtBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F87171',
  },
  addLiabilityHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  addLiabilityHeaderBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F87171',
  },
  liabilityTypeBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.pill,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  liabilityTypeBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  liabilityMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  utilizationText: {
    fontSize: 11,
    color: color.textMuted,
  },
  miniProgressTrack: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    marginTop: 5,
    overflow: 'hidden',
    width: '90%',
  },
  miniProgressBar: {
    height: '100%',
    borderRadius: 2,
  },
  liabilityRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  liabilityMinus: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F87171',
  },
  liabilityAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F87171',
  },
  payActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(34, 197, 94, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.35)',
  },
  payActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: color.gain,
  },
});
