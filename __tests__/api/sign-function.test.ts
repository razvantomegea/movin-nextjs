import { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/sign-function';

// Mock viem accounts
jest.mock('viem/accounts', () => ({
  privateKeyToAccount: jest.fn(() => ({
    signTypedData: jest.fn().mockResolvedValue('0x1234567890abcdef'),
  })),
}));

describe('/api/sign-function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle POST requests successfully with valid data', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        caller: '0x742d35Cc6634C0532925a3b8D238C8A9af8a13f8',
        selector: '0x12345678',
        nonce: 1,
        deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('signature');
    expect(data.signature).toBe('0x1234567890abcdef');
  });

  it('should reject non-POST requests', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('Method not allowed');
  });

  it('should validate required parameters', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        caller: '0x742d35Cc6634C0532925a3b8D238C8A9af8a13f8',
        // Missing selector, nonce, and deadline
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('Missing required parameters');
  });

  it('should reject past deadlines', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        caller: '0x742d35Cc6634C0532925a3b8D238C8A9af8a13f8',
        selector: '0x12345678',
        nonce: 1,
        deadline: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('Deadline must be in the future');
  });

  it('should reject deadlines too far in the future', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        caller: '0x742d35Cc6634C0532925a3b8D238C8A9af8a13f8',
        selector: '0x12345678',
        nonce: 1,
        deadline: Math.floor(Date.now() / 1000) + 86401, // More than 24 hours
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('Deadline cannot be more than 24 hours in the future');
  });

  it('should handle missing environment variable', async () => {
    // Temporarily remove the environment variable
    const originalKey = process.env.OWNER_PRIVATE_KEY;
    delete process.env.OWNER_PRIVATE_KEY;

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        caller: '0x742d35Cc6634C0532925a3b8D238C8A9af8a13f8',
        selector: '0x12345678',
        nonce: 1,
        deadline: Math.floor(Date.now() / 1000) + 3600,
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('Server configuration error');

    // Restore the environment variable
    process.env.OWNER_PRIVATE_KEY = originalKey;
  });

  it('should handle invalid private key format', async () => {
    // Temporarily set an invalid private key
    const originalKey = process.env.OWNER_PRIVATE_KEY;
    process.env.OWNER_PRIVATE_KEY = 'invalid-key';

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        caller: '0x742d35Cc6634C0532925a3b8D238C8A9af8a13f8',
        selector: '0x12345678',
        nonce: 1,
        deadline: Math.floor(Date.now() / 1000) + 3600,
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('Server configuration error');

    // Restore the environment variable
    process.env.OWNER_PRIVATE_KEY = originalKey;
  });

  it('should handle signing errors gracefully', async () => {
    // Mock the privateKeyToAccount to throw an error
    const { privateKeyToAccount } = require('viem/accounts');
    privateKeyToAccount.mockImplementationOnce(() => ({
      signTypedData: jest.fn().mockRejectedValue(new Error('Signing failed')),
    }));

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        caller: '0x742d35Cc6634C0532925a3b8D238C8A9af8a13f8',
        selector: '0x12345678',
        nonce: 1,
        deadline: Math.floor(Date.now() / 1000) + 3600,
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('Internal server error');
  });

  it('should validate EIP-712 message structure', async () => {
    const { privateKeyToAccount } = require('viem/accounts');
    const mockSignTypedData = jest.fn().mockResolvedValue('0x1234567890abcdef');
    privateKeyToAccount.mockReturnValue({ signTypedData: mockSignTypedData });

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        caller: '0x742d35Cc6634C0532925a3b8D238C8A9af8a13f8',
        selector: '0x12345678',
        nonce: 1,
        deadline: Math.floor(Date.now() / 1000) + 3600,
      },
    });

    await handler(req, res);

    expect(mockSignTypedData).toHaveBeenCalledWith({
      domain: {
        name: 'MOVINEarnV2',
        version: '2',
        chainId: 8453,
        verifyingContract: '0x865E693ebd875eD997BeEc565CFfBbE687Ee5776',
      },
      types: {
        FunctionCall: [
          { name: 'caller', type: 'address' },
          { name: 'selector', type: 'bytes4' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
        ],
      },
      primaryType: 'FunctionCall',
      message: {
        caller: '0x742d35Cc6634C0532925a3b8D238C8A9af8a13f8',
        selector: '0x12345678',
        nonce: BigInt(1),
        deadline: BigInt(Math.floor(Date.now() / 1000) + 3600),
      },
    });
  });
});
