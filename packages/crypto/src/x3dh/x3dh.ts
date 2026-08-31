import { KeyPair, PreKeyBundle } from '@securechat/types';
import { Curve25519 } from '../primitives/curves.js';
import { Hkdf } from '../primitives/hkdf.js';

export interface X3dhInitiatorResult {
  sharedMasterKey: Buffer;
  ephemeralKeyPair: KeyPair;
  oneTimePreKeyId?: number;
}

export class X3dhProtocol {
  private static readonly PROTOCOL_INFO = 'SecureChat_X3DH_InitialMasterKey_v1';

  /**
   * Alice (Initiator) executes X3DH to establish a shared master key with Bob (Recipient).
   * DH1 = DH(IK_A, SPK_B)
   * DH2 = DH(EK_A, IK_B)
   * DH3 = DH(EK_A, SPK_B)
   * DH4 = DH(EK_A, OPK_B) [if OPK present]
   * SK = HKDF(DH1 || DH2 || DH3 || DH4)
   */
  public static initiateSession(
    aliceIdentityKeyPair: KeyPair,
    bobPreKeyBundle: PreKeyBundle,
    ephemeralKeyPair?: KeyPair
  ): X3dhInitiatorResult {
    const aliceEphemeralKeyPair = ephemeralKeyPair || Curve25519.generateKeyPair();

    const dh1 = Curve25519.computeSharedSecret(aliceIdentityKeyPair.privateKey, bobPreKeyBundle.signedPreKey);
    const dh2 = Curve25519.computeSharedSecret(aliceEphemeralKeyPair.privateKey, bobPreKeyBundle.identityKey);
    const dh3 = Curve25519.computeSharedSecret(aliceEphemeralKeyPair.privateKey, bobPreKeyBundle.signedPreKey);

    let combinedDH = Buffer.concat([dh1, dh2, dh3]);

    if (bobPreKeyBundle.oneTimePreKey) {
      const dh4 = Curve25519.computeSharedSecret(aliceEphemeralKeyPair.privateKey, bobPreKeyBundle.oneTimePreKey);
      combinedDH = Buffer.concat([combinedDH, dh4]);
    }

    const salt = Buffer.alloc(32, 0);
    const sharedMasterKey = Hkdf.deriveKey(combinedDH, salt, this.PROTOCOL_INFO, 32);

    return {
      sharedMasterKey,
      ephemeralKeyPair: aliceEphemeralKeyPair,
      oneTimePreKeyId: bobPreKeyBundle.oneTimePreKeyId,
    };
  }

  /**
   * Bob (Recipient) receives the initial X3DH message from Alice and computes the identical shared master key.
   */
  public static receiveSession(
    bobIdentityKeyPair: KeyPair,
    bobSignedPreKeyPair: KeyPair,
    bobOneTimePreKeyPairs: Map<number, KeyPair>,
    aliceIdentityKeyPublic: string,
    aliceEphemeralKeyPublic: string,
    oneTimePreKeyId?: number
  ): Buffer {
    const dh1 = Curve25519.computeSharedSecret(bobSignedPreKeyPair.privateKey, aliceIdentityKeyPublic);
    const dh2 = Curve25519.computeSharedSecret(bobIdentityKeyPair.privateKey, aliceEphemeralKeyPublic);
    const dh3 = Curve25519.computeSharedSecret(bobSignedPreKeyPair.privateKey, aliceEphemeralKeyPublic);

    let combinedDH = Buffer.concat([dh1, dh2, dh3]);

    if (oneTimePreKeyId !== undefined && bobOneTimePreKeyPairs.has(oneTimePreKeyId)) {
      const opkPair = bobOneTimePreKeyPairs.get(oneTimePreKeyId)!;
      const dh4 = Curve25519.computeSharedSecret(opkPair.privateKey, aliceEphemeralKeyPublic);
      combinedDH = Buffer.concat([combinedDH, dh4]);
    }

    const salt = Buffer.alloc(32, 0);
    return Hkdf.deriveKey(combinedDH, salt, this.PROTOCOL_INFO, 32);
  }
}
