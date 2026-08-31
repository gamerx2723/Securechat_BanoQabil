import * as crypto from 'node:crypto';

export class Hkdf {
  /**
   * Derives key material using HKDF with SHA-256 hash function.
   */
  public static deriveKey(
    ikm: Buffer,
    salt: Buffer,
    info: string | Buffer,
    lengthBytes: number
  ): Buffer {
    const infoBuffer = typeof info === 'string' ? Buffer.from(info, 'utf-8') : info;
    const derived = crypto.hkdfSync('sha256', ikm, salt, infoBuffer, lengthBytes);
    return Buffer.from(derived);
  }

  /**
   * KDF for Root Key Ratchet: Outputs a new Root Key (32 bytes) and a new Chain Key (32 bytes).
   */
  public static kdfRoot(rootKey: Buffer, dhSharedSecret: Buffer): [Buffer, Buffer] {
    const derived = this.deriveKey(dhSharedSecret, rootKey, 'SecureChat_RootKeyRatchet_v1', 64);
    const newRootKey = derived.subarray(0, 32);
    const newChainKey = derived.subarray(32, 64);
    return [newRootKey, newChainKey];
  }

  /**
   * KDF for Symmetric Chain Key Ratchet: Outputs next Chain Key (32 bytes) and Message Key (32 bytes).
   */
  public static kdfChain(chainKey: Buffer): [Buffer, Buffer] {
    const derived = this.deriveKey(chainKey, Buffer.alloc(32, 0), 'SecureChat_MessageKeyChain_v1', 64);
    const nextChainKey = derived.subarray(0, 32);
    const messageKey = derived.subarray(32, 64);
    return [nextChainKey, messageKey];
  }
}
