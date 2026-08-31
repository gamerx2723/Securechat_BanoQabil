import { KeyPair, PreKeyBundle, EncryptedMessagePayload } from '@securechat/types';
import { Curve25519 } from '../primitives/curves.js';
import { X3dhProtocol } from '../x3dh/x3dh.js';
import { DoubleRatchetSession } from '../ratchet/double_ratchet.js';

export class SessionManager {
  private identityKeyPair: KeyPair;
  private signedPreKeyPair: KeyPair;
  private signedPreKeyId: number;
  private signedPreKeySignature: string;
  private oneTimePreKeyPairs: Map<number, KeyPair>;
  private activeSessions: Map<string, DoubleRatchetSession>; // Key: recipientDeviceId

  constructor(params?: {
    identityKeyPair?: KeyPair;
    signedPreKeyPair?: KeyPair;
    signedPreKeyId?: number;
    signedPreKeySignature?: string;
  }) {
    this.identityKeyPair = params?.identityKeyPair || Curve25519.generateKeyPair();
    this.signedPreKeyPair = params?.signedPreKeyPair || Curve25519.generateKeyPair();
    this.signedPreKeyId = params?.signedPreKeyId || 1;
    this.signedPreKeySignature = params?.signedPreKeySignature || 'SIG_' + Buffer.from(this.signedPreKeyPair.publicKey).toString('hex').slice(0, 32);
    this.oneTimePreKeyPairs = new Map();
    this.activeSessions = new Map();

    // Generate initial pool of 10 one-time prekeys
    this.generateOneTimePreKeys(10);
  }

  public getIdentityKeyPublic(): string {
    return this.identityKeyPair.publicKey;
  }

  public generateOneTimePreKeys(count: number): Array<{ keyId: number; publicKey: string }> {
    const output: Array<{ keyId: number; publicKey: string }> = [];
    const startId = this.oneTimePreKeyPairs.size + 1;
    for (let i = 0; i < count; i++) {
      const keyId = startId + i;
      const keyPair = Curve25519.generateKeyPair();
      this.oneTimePreKeyPairs.set(keyId, keyPair);
      output.push({ keyId, publicKey: keyPair.publicKey });
    }
    return output;
  }

  public getPreKeyBundle(userId: string, deviceId: string): PreKeyBundle {
    let oneTimePreKey: string | undefined;
    let oneTimePreKeyId: number | undefined;

    for (const [id, pair] of this.oneTimePreKeyPairs.entries()) {
      oneTimePreKeyId = id;
      oneTimePreKey = pair.publicKey;
      break;
    }

    return {
      userId,
      deviceId,
      identityKey: this.identityKeyPair.publicKey,
      signedPreKey: this.signedPreKeyPair.publicKey,
      signedPreKeyId: this.signedPreKeyId,
      signedPreKeySignature: this.signedPreKeySignature,
      oneTimePreKey,
      oneTimePreKeyId,
    };
  }

  /**
   * Initializes a session to send a message to a recipient using their prekey bundle.
   */
  public startOutgoingSession(recipientDeviceId: string, recipientBundle: PreKeyBundle): DoubleRatchetSession {
    const aliceEphemeralDhPair = Curve25519.generateKeyPair();
    const { sharedMasterKey } = X3dhProtocol.initiateSession(this.identityKeyPair, recipientBundle, aliceEphemeralDhPair);
    const session = DoubleRatchetSession.initAlice(sharedMasterKey, recipientBundle.signedPreKey, aliceEphemeralDhPair);
    this.activeSessions.set(recipientDeviceId, session);
    return session;
  }

  /**
   * Initializes a session from an incoming initial prekey message.
   */
  public startIncomingSession(
    senderDeviceId: string,
    senderIdentityKeyPublic: string,
    senderEphemeralKeyPublic: string,
    oneTimePreKeyId?: number
  ): DoubleRatchetSession {
    const sharedMasterKey = X3dhProtocol.receiveSession(
      this.identityKeyPair,
      this.signedPreKeyPair,
      this.oneTimePreKeyPairs,
      senderIdentityKeyPublic,
      senderEphemeralKeyPublic,
      oneTimePreKeyId
    );

    // Consume OPK after successful X3DH computation
    if (oneTimePreKeyId !== undefined) {
      this.oneTimePreKeyPairs.delete(oneTimePreKeyId);
    }

    const session = DoubleRatchetSession.initBob(sharedMasterKey, this.signedPreKeyPair);
    this.activeSessions.set(senderDeviceId, session);
    return session;
  }

  public encryptMessage(
    senderDeviceId: string,
    recipientDeviceId: string,
    plaintext: string
  ): EncryptedMessagePayload {
    const session = this.activeSessions.get(recipientDeviceId);
    if (!session) {
      throw new Error(`No active session with recipient device: ${recipientDeviceId}`);
    }
    return session.encrypt(plaintext, senderDeviceId, recipientDeviceId);
  }

  public decryptMessage(senderDeviceId: string, payload: EncryptedMessagePayload): string {
    let session = this.activeSessions.get(senderDeviceId);
    if (!session) {
      throw new Error(`No active ratchet session found for sender device: ${senderDeviceId}`);
    }
    return session.decrypt(payload);
  }

  public getSession(recipientDeviceId: string): DoubleRatchetSession | undefined {
    return this.activeSessions.get(recipientDeviceId);
  }
}
