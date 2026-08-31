import * as crypto from 'node:crypto';
import { KeyPair } from '@securechat/types';

export class Curve25519 {
  /**
   * Generates a new X25519 asymmetric key pair.
   */
  public static generateKeyPair(): KeyPair {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('x25519', {
      publicKeyEncoding: { type: 'spki', format: 'der' },
      privateKeyEncoding: { type: 'pkcs8', format: 'der' },
    });

    return {
      publicKey: publicKey.toString('base64'),
      privateKey: privateKey.toString('base64'),
    };
  }

  /**
   * Performs Diffie-Hellman shared secret calculation between local private key and remote public key.
   */
  public static computeSharedSecret(localPrivateKeyBase64: string, remotePublicKeyBase64: string): Buffer {
    const privateKeyObj = crypto.createPrivateKey({
      key: Buffer.from(localPrivateKeyBase64, 'base64'),
      format: 'der',
      type: 'pkcs8',
    });

    const publicKeyObj = crypto.createPublicKey({
      key: Buffer.from(remotePublicKeyBase64, 'base64'),
      format: 'der',
      type: 'spki',
    });

    return crypto.diffieHellman({
      privateKey: privateKeyObj,
      publicKey: publicKeyObj,
    });
  }
}
