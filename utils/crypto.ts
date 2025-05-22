import { toast } from 'sonner';
import { formatUnits, parseUnits } from 'viem';

// Network-related constants
export const NETWORK_NAMES: Record<string, string> = {
  '1': 'Ethereum Mainnet',
  '5': 'Goerli Testnet',
  '11155111': 'Sepolia Testnet',
  '56': 'BNB Smart Chain',
  '97': 'BNB Testnet',
  '137': 'Polygon Mainnet',
  '80001': 'Polygon Mumbai',
  '42161': 'Arbitrum One',
  '421614': 'Arbitrum Sepolia',
  '8453': 'Base Mainnet',
  '84532': 'Base Sepolia',
  '10': 'Optimism',
  '420': 'Optimism Goerli',
  '43114': 'Avalanche C-Chain',
  '250': 'Fantom Opera',
};

// Transaction related constants
export enum TransactionIcon {
  SENT = 'arrow-up-circle',
  RECEIVED = 'arrow-down-circle',
  STAKED = 'lock-closed',
  UNSTAKED = 'lock-open',
  CLAIMED = 'ribbon',
  DEFAULT = 'swap-horizontal',
}

export enum TransactionColor {
  SENT = 'red',
  RECEIVED = 'green',
  STAKED = 'blue',
  UNSTAKED = 'purple',
  CLAIMED = 'yellow',
  DEFAULT = 'gray',
}

export interface AddressFormatOptions {
  startLength: number;
  endLength: number;
  showChecksum: boolean;
}

export const DEFAULT_ADDRESS_FORMAT: AddressFormatOptions = {
  startLength: 6,
  endLength: 4,
  showChecksum: false,
};

export const DEFAULT_CURRENCY_FORMAT = {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

/**
 * Format a value as currency
 * @param value - Value to format as currency
 * @returns Formatted currency string
 */
export function formatCurrency(value: string | null): string {
  if (!value) return '$0.00';

  try {
    const numValue = parseFloat(value);
    return formatNumber(numValue, DEFAULT_CURRENCY_FORMAT);
  } catch (e) {
    console.error('Error formatting currency:', e);
    return '$0.00';
  }
}

/**
 * Format a number with the specified options
 * @param value - Number to format
 * @param options - Formatting options
 * @returns Formatted number string
 */
export function formatNumber(value: number, options = {}): string {
  return new Intl.NumberFormat('en-US', options).format(value);
}

/**
 * Format a number to display with limited decimal places
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted number as string
 */
export function formatDecimal(
  value: string | number | null | undefined,
  decimals: number = 2,
): string {
  if (value === null || value === undefined) return '0';
  if (value === 'N/A') return 'N/A';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  return num.toFixed(decimals);
}

/**
 * Format balance to use K, M, B, T suffixes for large numbers
 * @param balance - Balance value as string, number, or null
 * @param decimals - Number of decimal places to display (default: 2)
 * @returns Formatted balance with appropriate suffix
 */
export function formatBalanceWithSuffix(
  balance: string | number | null | undefined,
  decimals: number = 2,
): string {
  if (balance === null || balance === undefined) return '0';

  // Convert to number if it's a string
  const num = typeof balance === 'string' ? parseFloat(balance) : balance;

  if (isNaN(num)) return '0';

  // Helper function to truncate decimals instead of rounding
  const truncateDecimals = (value: number, decimalPlaces: number): string => {
    const factor = Math.pow(10, decimalPlaces);
    const truncated = Math.floor(value * factor) / factor;

    // Format to ensure exact number of decimal places
    const parts = truncated.toString().split('.');
    const integerPart = parts[0];
    let decimalPart = parts.length > 1 ? parts[1] : '';

    // Handle the case where there are no decimal places requested
    if (decimalPlaces === 0) return integerPart;

    // Pad with zeros if needed
    decimalPart = decimalPart.padEnd(decimalPlaces, '0');

    return `${integerPart}.${decimalPart.substring(0, decimalPlaces)}`;
  };

  // Special case for numbers less than 1 - use 4 decimal places
  if (num > 0 && num < 1) {
    return truncateDecimals(num, 4);
  }

  // Helper function to convert to suffix while preserving exact decimal value
  const formatWithSuffix = (value: number, divisor: number, suffix: string): string => {
    const divided = value / divisor;
    const integerPart = Math.floor(divided);
    const decimalPart = divided - integerPart;

    if (decimalPart === 0) {
      return `${integerPart}.${Array(decimals).fill('0').join('')}${suffix}`;
    }

    // Convert decimal part to string and remove leading "0."
    const decimalStr = decimalPart.toString().replace(/^0\./, '');
    // Ensure we have at least the required decimal places
    const paddedDecimal = decimalStr.padEnd(decimals, '0');
    // Take only up to the specified decimal places
    const trimmedDecimal = paddedDecimal.substring(0, decimals);

    return `${integerPart}.${trimmedDecimal}${suffix}`;
  };

  // Format with suffixes for large numbers
  if (num < 1000) {
    return truncateDecimals(num, decimals);
  }

  if (num < 1000000) {
    return formatWithSuffix(num, 1000, 'K');
  }

  if (num < 1000000000) {
    return formatWithSuffix(num, 1000000, 'M');
  }

  if (num < 1000000000000) {
    return formatWithSuffix(num, 1000000000, 'B');
  }

  return formatWithSuffix(num, 1000000000000, 'T');
}

/**
 * Format a date to a readable string
 * @param timestamp - Timestamp to format
 * @returns Formatted date string
 */
export function formatDate(timestamp: number | string | Date): string {
  if (!timestamp) return '';

  try {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    console.error('Error formatting date:', e);
    return '';
  }
}

/**
 * Format time remaining until unlock in days, hours, minutes
 * @param unlockTime - Seconds remaining until unlock
 * @returns Human-readable time remaining
 */
export function formatTimeRemaining(unlockTime: number | null | undefined): string {
  if (!unlockTime || unlockTime <= 0) return 'Not locked';

  // Calculate remaining time in seconds
  const seconds = unlockTime;

  if (seconds <= 0) return 'Unlocked';

  // Convert to days, hours, minutes
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);

  // Format the output
  let result = '';
  if (days > 0) result += `${days} day${days > 1 ? 's' : ''} `;
  if (hours > 0 || days > 0) result += `${hours} hour${hours > 1 ? 's' : ''} `;
  result += `${minutes} minute${minutes > 1 ? 's' : ''}`;

  return result;
}

/**
 * Format lock period in a human-readable way
 * @param lockPeriod - Lock period in seconds
 * @returns Formatted lock period (e.g., "3 months")
 */
export function formatLockPeriod(lockPeriod: number | null | undefined): string {
  if (!lockPeriod || lockPeriod <= 0) return 'No lock period';

  // Convert seconds to months (approximate)
  const months = Math.ceil(lockPeriod / (30 * 24 * 60 * 60));

  return `${months} month${months > 1 ? 's' : ''}`;
}

/**
 * Format an Ethereum address for display
 * @param address - Ethereum address to format
 * @param options - Optional formatting options
 * @returns Formatted address
 */
export function formatAddress(
  address: string | null | undefined,
  options?: Partial<AddressFormatOptions>,
): string {
  if (!address) return '';

  // Handle special cases
  if (address === 'Unknown' || address === 'Contract Creation' || !address.startsWith('0x')) {
    return address;
  }

  if (address.length <= 16) return address;

  const opts = { ...DEFAULT_ADDRESS_FORMAT, ...options };
  return `${address.substring(0, opts.startLength)}...${address.substring(
    address.length - opts.endLength,
  )}`;
}

/**
 * Get icon name for a transaction type
 * @param type - Transaction type
 * @returns Icon name for the transaction type
 */
export function getTransactionIcon(type: string): string {
  const typeLower = type.toLowerCase();

  if (typeLower.includes('send') || typeLower.includes('sent')) {
    return TransactionIcon.SENT;
  } else if (typeLower.includes('receive') || typeLower.includes('received')) {
    return TransactionIcon.RECEIVED;
  } else if (typeLower.includes('stake') || typeLower.includes('staked')) {
    return TransactionIcon.STAKED;
  } else if (typeLower.includes('unstake') || typeLower.includes('unstaked')) {
    return TransactionIcon.UNSTAKED;
  } else if (typeLower.includes('claim') || typeLower.includes('claimed')) {
    return TransactionIcon.CLAIMED;
  }

  return TransactionIcon.DEFAULT;
}

/**
 * Get transaction color based on transaction type
 * @param type - Transaction type
 * @returns Color string for the transaction type
 */
export function getTransactionColor(type: string): string {
  const typeLower = type.toLowerCase();

  if (typeLower.includes('send') || typeLower.includes('sent')) {
    return TransactionColor.SENT;
  } else if (typeLower.includes('receive') || typeLower.includes('received')) {
    return TransactionColor.RECEIVED;
  } else if (typeLower.includes('stake') || typeLower.includes('staked')) {
    return TransactionColor.STAKED;
  } else if (typeLower.includes('unstake') || typeLower.includes('unstaked')) {
    return TransactionColor.UNSTAKED;
  } else if (typeLower.includes('claim') || typeLower.includes('claimed')) {
    return TransactionColor.CLAIMED;
  }

  return TransactionColor.DEFAULT;
}

/**
 * Get the URL for a transaction in a block explorer
 * @param hash - Transaction hash
 * @param chainId - Chain ID (default: '1')
 * @returns Explorer URL for the transaction
 */
export function getTransactionExplorerUrl(hash: string, chainId: string = '1'): string {
  if (!hash) return '';

  // Base URLs for different blockchain explorers
  const baseUrls: Record<string, string> = {
    '1': 'https://etherscan.io/tx/',
    '5': 'https://goerli.etherscan.io/tx/',
    '11155111': 'https://sepolia.etherscan.io/tx/',
    '56': 'https://bscscan.com/tx/',
    '97': 'https://testnet.bscscan.com/tx/',
    '137': 'https://polygonscan.com/tx/',
    '80001': 'https://mumbai.polygonscan.com/tx/',
    '42161': 'https://arbiscan.io/tx/',
    '421614': 'https://sepolia.arbiscan.io/tx/',
    '8453': 'https://basescan.org/tx/',
    '84532': 'https://sepolia.basescan.org/tx/',
    '10': 'https://optimistic.etherscan.io/tx/',
    '420': 'https://goerli-optimism.etherscan.io/tx/',
    '43114': 'https://snowtrace.io/tx/',
    '250': 'https://ftmscan.com/tx/',
  };

  const baseUrl = baseUrls[chainId] || baseUrls['1']; // Default to Ethereum mainnet
  return `${baseUrl}${hash}`;
}

/**
 * Get the URL for an address in a block explorer
 * @param address - Ethereum address
 * @param chainId - Chain ID (default: '1')
 * @returns Explorer URL for the address
 */
export function getAddressExplorerUrl(address: string, chainId: string = '1'): string {
  if (!address) return '';

  // Base URLs for different blockchain explorers
  const baseUrls: Record<string, string> = {
    '1': 'https://etherscan.io/address/',
    '5': 'https://goerli.etherscan.io/address/',
    '11155111': 'https://sepolia.etherscan.io/address/',
    '56': 'https://bscscan.com/address/',
    '97': 'https://testnet.bscscan.com/address/',
    '137': 'https://polygonscan.com/address/',
    '80001': 'https://mumbai.polygonscan.com/address/',
    '42161': 'https://arbiscan.io/address/',
    '421614': 'https://sepolia.arbiscan.io/address/',
    '8453': 'https://basescan.org/address/',
    '84532': 'https://sepolia.basescan.org/address/',
    '10': 'https://optimistic.etherscan.io/address/',
    '420': 'https://goerli-optimism.etherscan.io/address/',
    '43114': 'https://snowtrace.io/address/',
    '250': 'https://ftmscan.com/address/',
  };

  const baseUrl = baseUrls[chainId] || baseUrls['1']; // Default to Ethereum mainnet
  return `${baseUrl}${address}`;
}

/**
 * Open a transaction in a block explorer
 * @param hash - Transaction hash
 * @param chainId - Chain ID (default: '1')
 */
export function openTransactionInExplorer(hash: string, chainId: string = '1'): void {
  if (!hash) return;

  try {
    const url = getTransactionExplorerUrl(hash, chainId);
    window.open(url, '_blank');
  } catch (e) {
    console.error('Error opening transaction in explorer:', e);
  }
}

/**
 * Open an account in a block explorer
 * @param address - Account address
 * @param chainId - Chain ID (default: '1')
 */
export function openAccountInExplorer(address: string, chainId: string = '1'): void {
  if (!address) return;

  try {
    const url = getAddressExplorerUrl(address, chainId);
    window.open(url, '_blank');
  } catch (e) {
    console.error('Error opening account in explorer:', e);
  }
}

/**
 * Copy text to clipboard and show a toast notification
 * @param text - Text to copy to clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    toast.error('Failed to copy to clipboard');
  }
}

/**
 * Get network name from chain ID
 * @param chainId - Chain ID (decimal or hex)
 * @returns Network name
 */
export function getNetworkName(chainId: string | null): string {
  if (!chainId) return 'Unknown Network';
  return NETWORK_NAMES[chainId] || `Chain ID: ${chainId}`;
}

/**
 * Format a numeric string according to token decimals
 * @param amount The amount as a string
 * @param decimals The number of decimals
 * @returns The formatted amount as a string
 */
export function formatTokenAmount(amount: string, decimals: number): string {
  try {
    return formatUnits(parseUnits(amount, decimals), decimals);
  } catch (error) {
    console.error('Error formatting token amount:', error);
    return amount;
  }
}

/**
 * Parse a user-friendly amount to the raw amount with decimals
 * @param amount The user-friendly amount as a string
 * @param decimals The number of decimals
 * @returns The raw amount as a bigint
 */
export function parseTokenAmount(amount: string, decimals: number): bigint {
  try {
    return parseUnits(amount, decimals);
  } catch (error) {
    console.error('Error parsing token amount:', error);
    return BigInt(0);
  }
}
