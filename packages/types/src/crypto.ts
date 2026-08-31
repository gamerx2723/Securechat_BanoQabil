export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export interface PreKeyBundle {
  userId: string;
  deviceId: string;
  identityKey: string; // Base64
  signedPreKey: string; // Base64
  signedPreKeyId: number;
  signedPreKeySignature: string; // Base64
  oneTimePreKey?: string; // Base64
  oneTimePreKeyId?: number;
}

export interface EncryptedMessagePayload {
  version: number;
  senderDeviceId: string;
  recipientDeviceId: string;
  isPreKeyMessage: boolean;
  ephemeralKey?: string; // Base64 (used for initial X3DH / DH ratchet)
  oneTimePreKeyId?: number;
  sequenceNumber: number;
  previousChainLength: number;
  ciphertext: string; // Base64 AES-256-GCM
  iv: string; // Base64
  authTag: string; // Base64
}

export interface RatchetStateSerialized {
  dhsPair: KeyPair;
  dhrPublic?: string;
  rootKey: string;
  sendChainKey?: string;
  recvChainKey?: string;
  sendSequence: number;
  recvSequence: number;
  prevSendSequence: number;
  skippedMessageKeys: Record<string, string>; // "dhPub:seq" -> keyBase64
}
