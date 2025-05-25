export const mapError = (error: unknown) => {
  const errorMessage =
    (error instanceof Error ? error.message : error?.toString()) ?? 'Unknown error';

  if (errorMessage.includes('rejected')) {
    return 'User rejected the request';
  }

  return errorMessage;
};
