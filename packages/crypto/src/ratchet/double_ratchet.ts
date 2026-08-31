import { KeyPair, EncryptedMessagePayload, RatchetStateSerialized } from '@securechat/types';
import { Curve25519 } from '../primitives/curves.js';
import { AesGcm } from '../primitives/aes.js';
import { Hkdf } from '../primitives/hkdf.js';

export class DoubleRatchetSession {
  private dhsPair: KeyPair;
  private dhrPublic: string | null;
  private rootKey: Buffer;
  private sendChainKey: Buffer | null;
  private recvChainKey: Buffer | null;
  private sendSequence: number;
  private recvSequence: number;
  private prevSendSequence: number;
  private skippedMessageKeys: Map<string, Buffer>; // Key: `${dhrPublic}:${sequenceNumber}` -> 32-byte message key

  private static readonly MAX_SKIP = 1000;

  constructor(params: {
    dhsPair?: KeyPair;
    dhrPublic?: string | null;
    rootKey: Buffer;
    sendChainKey?: Buffer | null;
    recvChainKey?: Buffer | null;
  }) {
    this.dhsPair = params.dhsPair || Curve25519.generateKeyPair();
    this.dhrPublic = params.dhrPublic || null;
    this.rootKey = params.rootKey;
    this.sendChainKey = params.sendChainKey || null;
    this.recvChainKey = params.recvChainKey || null;
    this.sendSequence = 0;
    this.recvSequence = 0;
    this.prevSendSequence = 0;
    this.skippedMessageKeys = new Map();
  }

  /**
   * Initializes Bob's session (the recipient of the first message in X3DH).
   */
  public static initBob(sharedMasterKey: Buffer, bobSignedPreKeyPair: KeyPair): DoubleRatchetSession {
    return new DoubleRatchetSession({
      dhsPair: bobSignedPreKeyPair,
      dhrPublic: null,
      rootKey: sharedMasterKey,
      sendChainKey: null,
      recvChainKey: null,
    });
  }

  /**
   * Initializes Alice's session (the initiator of the first message in X3DH).
   */
  public static initAlice(
    sharedMasterKey: Buffer,
    bobSignedPreKeyPublic: string,
    aliceDhPair?: KeyPair
  ): DoubleRatchetSession {
    const dhPair = aliceDhPair || Curve25519.generateKeyPair();
    const dhSecret = Curve25519.computeSharedSecret(dhPair.privateKey, bobSignedPreKeyPublic);
    const [newRootKey, sendChainKey] = Hkdf.kdfRoot(sharedMasterKey, dhSecret);

    const session = new DoubleRatchetSession({
      dhsPair: dhPair,
      dhrPublic: bobSignedPreKeyPublic,
      rootKey: newRootKey,
      sendChainKey: sendChainKey,
      recvChainKey: null,
    });

    return session;
  }

  /**
   * Encrypts a plaintext message for the recipient.
   */
  public encrypt(
    plaintext: string | Buffer,
    senderDeviceId: string,
    recipientDeviceId: string
  ): EncryptedMessagePayload {
    if (!this.sendChainKey) {
      if (!this.dhrPublic) {
        throw new Error('Cannot encrypt message: Remote DH public key is not established');
      }
      const [newRootKey, newSendChainKey] = Hkdf.kdfRoot(
        this.rootKey,
        Curve25519.computeSharedSecret(this.dhsPair.privateKey, this.dhrPublic)
      );
      this.rootKey = newRootKey;
      this.sendChainKey = newSendChainKey;
    }

    const [nextChainKey, messageKey] = Hkdf.kdfChain(this.sendChainKey);
    this.sendChainKey = nextChainKey;

    const currentSequence = this.sendSequence;
    this.sendSequence += 1;

    // Associated Authenticated Data binding recipient, sequence, and DH public key
    const associatedData = Buffer.from(
      JSON.stringify({
        dh: this.dhsPair.publicKey,
        seq: currentSequence,
        pn: this.prevSendSequence,
        sender: senderDeviceId,
        recipient: recipientDeviceId,
      }),
      'utf-8'
    );

    const { ciphertext, iv, authTag } = AesGcm.encrypt(messageKey, plaintext, associatedData);

    return {
      version: 1,
      senderDeviceId,
      recipientDeviceId,
      isPreKeyMessage: false,
      ephemeralKey: this.dhsPair.publicKey,
      sequenceNumber: currentSequence,
      previousChainLength: this.prevSendSequence,
      ciphertext,
      iv,
      authTag,
    };
  }

  /**
   * Decrypts an incoming encrypted message envelope.
   */
  public decrypt(payload: EncryptedMessagePayload): string {
    const remoteDhKey = payload.ephemeralKey;
    if (!remoteDhKey) {
      throw new Error('Missing ephemeral DH public key in message payload');
    }

    const associatedData = Buffer.from(
      JSON.stringify({
        dh: remoteDhKey,
        seq: payload.sequenceNumber,
        pn: payload.previousChainLength,
        sender: payload.senderDeviceId,
        recipient: payload.recipientDeviceId,
      }),
      'utf-8'
    );

    // 1. Check if this message key was already skipped and cached
    const skippedKeyId = `${remoteDhKey}:${payload.sequenceNumber}`;
    if (this.skippedMessageKeys.has(skippedKeyId)) {
      const messageKey = this.skippedMessageKeys.get(skippedKeyId)!;
      this.skippedMessageKeys.delete(skippedKeyId);
      const decryptedBuffer = AesGcm.decrypt(
        messageKey,
        payload.ciphertext,
        payload.iv,
        payload.authTag,
        associatedData
      );
      return decryptedBuffer.toString('utf-8');
    }

    // 2. If the remote DH key changed, perform DH Ratchet step
    if (remoteDhKey !== this.dhrPublic) {
      this.skipMessageKeys(payload.previousChainLength);
      this.dhRatchetStep(remoteDhKey);
    }

    // 3. Skip any missed message keys in current receiving chain
    this.skipMessageKeys(payload.sequenceNumber);

    // 4. Derive message key from receiving chain
    if (!this.recvChainKey) {
      throw new Error('Receive chain key is not available');
    }

    const [nextRecvChainKey, messageKey] = Hkdf.kdfChain(this.recvChainKey);
    this.recvChainKey = nextRecvChainKey;
    this.recvSequence += 1;

    const decryptedBuffer = AesGcm.decrypt(
      messageKey,
      payload.ciphertext,
      payload.iv,
      payload.authTag,
      associatedData
    );

    return decryptedBuffer.toString('utf-8');
  }

  private dhRatchetStep(remoteDhKey: string): void {
    this.prevSendSequence = this.sendSequence;
    this.sendSequence = 0;
    this.recvSequence = 0;
    this.dhrPublic = remoteDhKey;

    const dhRecvSecret = Curve25519.computeSharedSecret(this.dhsPair.privateKey, this.dhrPublic);
    const [rootKeyAfterRecv, recvChainKey] = Hkdf.kdfRoot(this.rootKey, dhRecvSecret);
    this.rootKey = rootKeyAfterRecv;
    this.recvChainKey = recvChainKey;

    this.dhsPair = Curve25519.generateKeyPair();
    const dhSendSecret = Curve25519.computeSharedSecret(this.dhsPair.privateKey, this.dhrPublic);
    const [rootKeyAfterSend, sendChainKey] = Hkdf.kdfRoot(this.rootKey, dhSendSecret);
    this.rootKey = rootKeyAfterSend;
    this.sendChainKey = sendChainKey;
  }

  private skipMessageKeys(untilSequence: number): void {
    if (!this.recvChainKey || !this.dhrPublic) return;

    if (this.recvSequence + DoubleRatchetSession.MAX_SKIP < untilSequence) {
      throw new Error('Too many skipped messages in ratchet chain');
    }

    while (this.recvSequence < untilSequence) {
      const [nextRecvChainKey, messageKey] = Hkdf.kdfChain(this.recvChainKey);
      this.recvChainKey = nextRecvChainKey;
      const keyId = `${this.dhrPublic}:${this.recvSequence}`;
      this.skippedMessageKeys.set(keyId, messageKey);
      this.recvSequence += 1;
    }
  }

  /**
   * Exports current session state for persistent encrypted storage (Room / SQLCipher).
   */
  public serialize(): RatchetStateSerialized {
    const skippedObj: Record<string, string> = {};
    for (const [k, v] of this.skippedMessageKeys.entries()) {
      skippedObj[k] = v.toString('base64');
    }

    return {
      dhsPair: this.dhsPair,
      dhrPublic: this.dhrPublic || undefined,
      rootKey: this.rootKey.toString('base64'),
      sendChainKey: this.sendChainKey ? this.sendChainKey.toString('base64') : undefined,
      recvChainKey: this.recvChainKey ? this.recvChainKey.toString('base64') : undefined,
      sendSequence: this.sendSequence,
      recvSequence: this.recvSequence,
      prevSendSequence: this.prevSendSequence,
      skippedMessageKeys: skippedObj,
    };
  }
}
