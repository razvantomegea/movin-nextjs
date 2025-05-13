/**
 * Interface for categorized error response
 */
export interface ParsedError {
  message: string; // User-friendly message
  type: ErrorType; // Error category
  severity: ErrorSeverity; // Error severity
  originalError?: unknown; // Original error for debugging
  code?: string | number; // Error code if available
}

/**
 * Error categories
 */
export enum ErrorType {
  NETWORK = 'network', // Network connectivity issues
  RATE_LIMIT = 'rate_limit', // Too many requests (429)
  CONTRACT_EXECUTION = 'contract_execution', // Smart contract errors
  TRANSACTION = 'transaction', // Transaction-related errors
  WALLET = 'wallet', // Wallet connection/permission errors
  AUTH = 'auth', // Authentication errors
  API = 'api', // General API errors
  UNKNOWN = 'unknown', // Unclassified errors
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  INFO = 'info', // Informational, not critical
  WARNING = 'warning', // Warning, operation may proceed
  ERROR = 'error', // Error, operation failed but app can continue
  CRITICAL = 'critical', // Critical error, may require app restart
}

/**
 * MovinToken specific error types
 */
export enum MovinTokenErrorType {
  INSUFFICIENT_ALLOWANCE = 'insufficient allowance',
  INSUFFICIENT_BALANCE = 'insufficient balance',
  ZERO_AMOUNT = 'zero amount',
  USER_REJECTED = 'user rejected',
  GAS_ERROR = 'gas error',
  REENTRANCY = 'reentrancy',
  INSUFFICIENT_FUNDS = 'insufficient funds',
  EXCEEDS_MAX_SUPPLY = 'exceeds max supply',
  INVALID_ADDRESS = 'invalid address',
  PAUSED = 'paused',
  UNAUTHORIZED = 'unauthorized',
  UNKNOWN = 'unknown',
}

/**
 * MovinToken error messages mapping
 */
const MOVIN_TOKEN_ERROR_MESSAGES: Record<MovinTokenErrorType, string> = {
  [MovinTokenErrorType.INSUFFICIENT_ALLOWANCE]:
    'Insufficient allowance. Please approve the contract to spend your tokens first.',
  [MovinTokenErrorType.INSUFFICIENT_BALANCE]: 'Insufficient token balance for the operation.',
  [MovinTokenErrorType.ZERO_AMOUNT]: 'Amount must be greater than zero.',
  [MovinTokenErrorType.USER_REJECTED]: 'Transaction was rejected in your wallet.',
  [MovinTokenErrorType.GAS_ERROR]: 'Error with gas estimation. Your transaction may be reverting.',
  [MovinTokenErrorType.REENTRANCY]:
    'Another transaction is still processing. Please wait a moment and try again.',
  [MovinTokenErrorType.INSUFFICIENT_FUNDS]: 'Insufficient funds to complete this transaction.',
  [MovinTokenErrorType.EXCEEDS_MAX_SUPPLY]: 'Operation would exceed the maximum token supply.',
  [MovinTokenErrorType.INVALID_ADDRESS]: 'Invalid address provided for the operation.',
  [MovinTokenErrorType.PAUSED]: 'The contract is currently paused. Please try again later.',
  [MovinTokenErrorType.UNAUTHORIZED]:
    'Unauthorized. You do not have permission to perform this action.',
  [MovinTokenErrorType.UNKNOWN]: 'An unknown error occurred. Please try again later.',
};

/**
 * Get friendly error message for MovinToken errors
 * @param error The error object to parse
 * @param context Context where the error occurred (for generic fallback)
 * @returns User-friendly error message
 */
export function getMovinTokenErrorMessage(error: any, context: string): string {
  if (!error || !error.message) {
    return `Failed to ${context}. Please try again later.`;
  }

  const msg = typeof error.message === 'string' ? error.message.toLowerCase() : '';

  // Check for custom error codes from the ABI
  for (const [type, pattern] of Object.entries(MovinTokenErrorType)) {
    if (msg.includes(pattern)) {
      return MOVIN_TOKEN_ERROR_MESSAGES[pattern as MovinTokenErrorType];
    }
  }

  // Generic fallback
  return `Error in ${context}: ${error.message}`;
}

/**
 * Check if an error is an RPC error
 */
function isRpcError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    // Common JSON-RPC error codes
    ((typeof (error as any).code === 'number' &&
      ((error as any).code === -32000 ||
        (error as any).code === -32001 ||
        (error as any).code === -32002 ||
        (error as any).code === -32003 ||
        (error as any).code === -32004 ||
        (error as any).code === -32005 ||
        (error as any).code === -32006 ||
        (error as any).code === -32603 ||
        (error as any).code === 4001)) ||
      // Viem specific code format
      (typeof (error as any).code === 'string' && (error as any).code.includes('CALL_EXCEPTION')))
  );
}

/**
 * Check if an error is a contract error
 */
function isContractError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (('reason' in error && typeof (error as any).reason === 'string') ||
      ('data' in error && typeof (error as any).data === 'object' && (error as any).data !== null))
  );
}

/**
 * Check if an error is a Web3/Viem error
 */
function isWeb3Error(error: unknown): boolean {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as any).message === 'string'
  ) {
    const msg = (error as { message: string }).message.toLowerCase();
    return (
      msg.includes('insufficient funds') ||
      msg.includes('gas') ||
      msg.includes('nonce') ||
      msg.includes('transaction') ||
      msg.includes('rejected') ||
      msg.includes('cancelled') ||
      msg.includes('timeout') ||
      msg.includes('network') ||
      msg.includes('already known') ||
      msg.includes('intrinsic gas too low') ||
      msg.includes('replacement fee too low')
    );
  }
  return false;
}

/**
 * Check if an error is an HTTP error
 */
function isHttpError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as any).status === 'number'
  );
}

/**
 * Parse RPC errors from blockchain providers
 */
function parseRpcError(error: any): ParsedError {
  // Check for rate limit errors (429)
  if (
    error.code === -32603 &&
    error.message &&
    typeof error.message === 'string' &&
    error.message.includes('429')
  ) {
    return {
      message: 'Rate limit exceeded. Please wait a moment and try again.',
      type: ErrorType.RATE_LIMIT,
      severity: ErrorSeverity.WARNING,
      originalError: error,
      code: error.code,
    };
  }

  // Check for missing revert data
  if (
    error.message &&
    typeof error.message === 'string' &&
    error.message.includes('missing revert data')
  ) {
    return {
      message: 'Transaction failed. There may be an issue with the contract or network.',
      type: ErrorType.CONTRACT_EXECUTION,
      severity: ErrorSeverity.ERROR,
      originalError: error,
      code: error.code,
    };
  }

  // User rejected transaction
  if (error.code === 4001 || (error.message && error.message.includes('user rejected'))) {
    return {
      message: 'Transaction was rejected by the user.',
      type: ErrorType.WALLET,
      severity: ErrorSeverity.INFO,
      originalError: error,
      code: error.code,
    };
  }

  // Insufficient funds
  if (
    error.message &&
    typeof error.message === 'string' &&
    error.message.includes('insufficient funds')
  ) {
    return {
      message: 'Insufficient funds for gas * price + value.',
      type: ErrorType.TRANSACTION,
      severity: ErrorSeverity.ERROR,
      originalError: error,
      code: error.code,
    };
  }

  // Network error
  if (error.code === -32603) {
    return {
      message: 'Network error. Please check your connection and try again.',
      type: ErrorType.NETWORK,
      severity: ErrorSeverity.ERROR,
      originalError: error,
      code: error.code,
    };
  }

  // Default RPC error
  return {
    message: error.message || 'Blockchain error occurred',
    type: ErrorType.CONTRACT_EXECUTION,
    severity: ErrorSeverity.ERROR,
    originalError: error,
    code: error.code,
  };
}

/**
 * Parse contract-specific errors
 */
function parseContractError(error: any): ParsedError {
  // Extract reason if available
  if (error.reason && typeof error.reason === 'string') {
    return {
      message: humanizeContractMessage(error.reason),
      type: ErrorType.CONTRACT_EXECUTION,
      severity: ErrorSeverity.ERROR,
      originalError: error,
    };
  }

  // Use data field if reason is not available
  if (error.data) {
    try {
      // Some contract errors include decoded data
      const reason = error.data.message || JSON.stringify(error.data);
      return {
        message: humanizeContractMessage(reason),
        type: ErrorType.CONTRACT_EXECUTION,
        severity: ErrorSeverity.ERROR,
        originalError: error,
      };
    } catch (e) {
      // Fallback if parsing fails
      return {
        message: 'Contract execution failed',
        type: ErrorType.CONTRACT_EXECUTION,
        severity: ErrorSeverity.ERROR,
        originalError: error,
      };
    }
  }

  // Default contract error
  return {
    message: 'Contract execution failed with an unknown error',
    type: ErrorType.CONTRACT_EXECUTION,
    severity: ErrorSeverity.ERROR,
    originalError: error,
  };
}

/**
 * Parse Web3/Viem library errors
 */
function parseWeb3Error(error: any): ParsedError {
  const message = error.message.toLowerCase();

  // Insufficient funds
  if (message.includes('insufficient funds')) {
    return {
      message: 'Not enough ETH to complete this transaction.',
      type: ErrorType.TRANSACTION,
      severity: ErrorSeverity.ERROR,
      originalError: error,
    };
  }

  // Gas-related errors
  if (message.includes('gas')) {
    if (message.includes('intrinsic gas too low')) {
      return {
        message: 'Transaction requires more gas than provided.',
        type: ErrorType.TRANSACTION,
        severity: ErrorSeverity.ERROR,
        originalError: error,
      };
    }
    return {
      message: 'Gas estimation failed. The transaction may fail.',
      type: ErrorType.TRANSACTION,
      severity: ErrorSeverity.ERROR,
      originalError: error,
    };
  }

  // Nonce errors
  if (message.includes('nonce')) {
    return {
      message: 'Transaction nonce error. Please try again.',
      type: ErrorType.TRANSACTION,
      severity: ErrorSeverity.ERROR,
      originalError: error,
    };
  }

  // User rejected/cancelled
  if (message.includes('rejected') || message.includes('cancelled')) {
    return {
      message: 'Transaction was cancelled.',
      type: ErrorType.WALLET,
      severity: ErrorSeverity.INFO,
      originalError: error,
    };
  }

  // Network issues
  if (message.includes('network') || message.includes('timeout')) {
    return {
      message: 'Network connection issue. Please check your internet connection.',
      type: ErrorType.NETWORK,
      severity: ErrorSeverity.ERROR,
      originalError: error,
    };
  }

  // Default Web3 error
  return {
    message: error.message || 'Transaction error occurred',
    type: ErrorType.TRANSACTION,
    severity: ErrorSeverity.ERROR,
    originalError: error,
  };
}

/**
 * Parse HTTP errors (like API calls)
 */
function parseHttpError(error: any): ParsedError {
  // Rate limiting
  if (error.status === 429) {
    return {
      message: 'Too many requests. Please try again later.',
      type: ErrorType.RATE_LIMIT,
      severity: ErrorSeverity.WARNING,
      originalError: error,
      code: error.status,
    };
  }

  // Authentication errors
  if (error.status === 401 || error.status === 403) {
    return {
      message: 'Authentication error. Please log in again.',
      type: ErrorType.AUTH,
      severity: ErrorSeverity.ERROR,
      originalError: error,
      code: error.status,
    };
  }

  // Server errors
  if (error.status >= 500) {
    return {
      message: 'Server error. Please try again later.',
      type: ErrorType.API,
      severity: ErrorSeverity.ERROR,
      originalError: error,
      code: error.status,
    };
  }

  // Default HTTP error
  return {
    message: error.message || `HTTP error ${error.status}`,
    type: ErrorType.API,
    severity: ErrorSeverity.ERROR,
    originalError: error,
    code: error.status,
  };
}

/**
 * Extract a message from an unknown error type
 */
function getMessageFromUnknown(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }
  if (error === null) {
    return 'Null error occurred';
  }
  if (error === undefined) {
    return 'Undefined error occurred';
  }
  if (typeof error === 'object') {
    const obj = error as Record<string, unknown>;
    if ('message' in obj && typeof obj['message'] === 'string') {
      return obj['message'];
    }
    try {
      return JSON.stringify(error);
    } catch {
      return 'Unknown error object';
    }
  }
  return 'Unknown error occurred';
}

/**
 * Make contract error messages more user-friendly
 */
function humanizeContractMessage(message: string): string {
  // Clean up common contract error patterns
  let cleaned = message
    .replace(/execution reverted:/i, '')
    .replace(/Error:/i, '')
    .trim();

  // Map known error codes to user-friendly messages
  const errorMap: Record<string, string> = {
    'ERC20: insufficient allowance': 'Insufficient token allowance. Please approve more tokens.',
    'ERC20: transfer amount exceeds balance': 'Insufficient token balance for this transaction.',
    ERC20InvalidSender: 'Invalid sender address for this transaction.',
    ERC20InvalidReceiver: 'Invalid receiver address for this transaction.',
    ERC20InsufficientBalance: 'Insufficient token balance for this transaction.',
    ERC20InsufficientAllowance: 'Insufficient token allowance. Please approve more tokens.',
    ExceedsMaxSupply: 'This operation would exceed the maximum token supply.',
    ZeroAmountNotAllowed: 'Amount must be greater than zero.',
    InvalidAddress: 'Invalid address provided for the operation.',
    EnforcedPause: 'The contract is currently paused. Please try again later.',
    ExpectedPause: 'This operation can only be performed when the contract is paused.',
    OwnableUnauthorizedAccount: 'Unauthorized. Only the contract owner can perform this action.',
    'transfer failed': 'Token transfer failed. Please try again.',
  };

  // Return mapped message or the cleaned message
  for (const [key, value] of Object.entries(errorMap)) {
    if (cleaned.includes(key)) {
      return value;
    }
  }

  return cleaned || 'Contract execution failed';
}

/**
 * Main error parsing method that categorizes errors and provides user-friendly messages
 * @param error Any caught error
 * @returns Parsed error with user-friendly message and categorization
 */
export function parseError(error: unknown): ParsedError {
  // Handle RPC errors (common in blockchain interactions)
  if (isRpcError(error)) {
    return parseRpcError(error);
  }

  // Handle contract errors
  if (isContractError(error)) {
    return parseContractError(error);
  }

  // Handle Web3/Viem errors
  if (isWeb3Error(error)) {
    return parseWeb3Error(error);
  }

  // Handle HTTP errors
  if (isHttpError(error)) {
    return parseHttpError(error);
  }

  // Handle JavaScript/TypeScript errors
  if (error instanceof Error) {
    return {
      message: error.message || 'An error occurred',
      type: ErrorType.UNKNOWN,
      severity: ErrorSeverity.ERROR,
      originalError: error,
    };
  }

  // Handle unknown errors (non-Error objects, strings, etc.)
  return {
    message: getMessageFromUnknown(error),
    type: ErrorType.UNKNOWN,
    severity: ErrorSeverity.ERROR,
    originalError: error,
  };
}
