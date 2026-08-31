import * as crypto from 'node:crypto';

export interface AesGcmResult {
  ciphertext: string; // Base64
  iv: string; // Base64
  authTag: string; // Base64
}

export class AesGcm {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 12; // 96 bits for GCM standard

  /**
   * Encrypts plaintext buffer or string using AES-256-GCM authenticated encryption.
   */
  public static encrypt(key32Bytes: Buffer, plaintext: string | Buffer, associatedData?: Buffer): AesGcmResult {
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(this.ALGORITHM, key32Bytes, iv);

    if (associatedData) {
      cipher.setAAD(associatedData);
    }

    const inputBuffer = typeof plaintext === 'string' ? Buffer.from(plaintext, 'utf-8') : plaintext;
    const encrypted = Buffer.concat([cipher.update(inputBuffer), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      ciphertext: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    };
  }

  /**
   * Decrypts AES-256-GCM ciphertext and validates authentication tag.
   */
  public static decrypt(
    key32Bytes: Buffer,
    ciphertextBase64: string,
    ivBase64: string,
    authTagBase64: string,
    associatedData?: Buffer
  ): Buffer {
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    const ciphertext = Buffer.from(ciphertextBase64, 'base64');

    const decipher = crypto.createDecipheriv(this.ALGORITHM, key32Bytes, iv);
    decipher.setAuthTag(authTag);

    if (associatedData) {
      decipher.setAAD(associatedData);
    }

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  }
}
