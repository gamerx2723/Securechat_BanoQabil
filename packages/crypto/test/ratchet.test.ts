import { SessionManager } from '../src/session/session_manager.js';
import { Curve25519 } from '../src/primitives/curves.js';
import { AesGcm } from '../src/primitives/aes.js';
import assert from 'node:assert';

function testCryptoSuite() {
  console.log('--- Running SecureChat Cryptographic Engine Test Suite ---');

  // Test 1: Curve25519 Key Generation and Shared Secret
  const keyA = Curve25519.generateKeyPair();
  const keyB = Curve25519.generateKeyPair();
  const secretA = Curve25519.computeSharedSecret(keyA.privateKey, keyB.publicKey);
  const secretB = Curve25519.computeSharedSecret(keyB.privateKey, keyA.publicKey);
  assert.strictEqual(secretA.toString('hex'), secretB.toString('hex'), 'ECDH shared secrets must match');
  console.log('[PASS] Test 1: Curve25519 Shared Secret Agreement');

  // Test 2: AES-256-GCM AEAD Encryption & Decryption
  const randomKey = Buffer.alloc(32, 7);
  const plaintext = 'Secret Zero-Trust Message Payload 12345';
  const aad = Buffer.from('metadata-header-ad');
  const encrypted = AesGcm.encrypt(randomKey, plaintext, aad);
  const decrypted = AesGcm.decrypt(randomKey, encrypted.ciphertext, encrypted.iv, encrypted.authTag, aad);
  assert.strictEqual(decrypted.toString('utf-8'), plaintext, 'AES-GCM decrypted text must match original plaintext');
  console.log('[PASS] Test 2: AES-256-GCM Authenticated Encryption/Decryption');

  // Test 3: X3DH Session Initiation & Double Ratchet Multi-Turn Chat
  const aliceManager = new SessionManager();
  const bobManager = new SessionManager();

  const aliceDeviceId = 'DEV-ALICE-01';
  const bobDeviceId = 'DEV-BOB-01';

  const bobPreKeyBundle = bobManager.getPreKeyBundle('bob-user-id', bobDeviceId);
  aliceManager.startOutgoingSession(bobDeviceId, bobPreKeyBundle);

  // Alice -> Bob (Message 1)
  const msg1 = aliceManager.encryptMessage(aliceDeviceId, bobDeviceId, 'Hello Bob! This is message 1.');
  
  // Bob receives message 1 and initializes session via X3DH with Alice's identity key
  bobManager.startIncomingSession(
    aliceDeviceId,
    aliceManager.getIdentityKeyPublic(),
    msg1.ephemeralKey!,
    bobPreKeyBundle.oneTimePreKeyId
  );
  const bobDecrypted1 = bobManager.decryptMessage(aliceDeviceId, msg1);
  assert.strictEqual(bobDecrypted1, 'Hello Bob! This is message 1.');
  console.log('[PASS] Test 3: Alice -> Bob Initial X3DH Double Ratchet Turn 1');

  // Bob -> Alice (Message 2)
  const msg2 = bobManager.encryptMessage(bobDeviceId, aliceDeviceId, 'Hi Alice! Received your message.');
  const aliceDecrypted2 = aliceManager.decryptMessage(bobDeviceId, msg2);
  assert.strictEqual(aliceDecrypted2, 'Hi Alice! Received your message.');
  console.log('[PASS] Test 4: Bob -> Alice DH Ratchet Step Turn 2');

  // Alice -> Bob (Message 3)
  const msg3 = aliceManager.encryptMessage(aliceDeviceId, bobDeviceId, 'Awesome! End-to-End Encryption verified.');
  const bobDecrypted3 = bobManager.decryptMessage(aliceDeviceId, msg3);
  assert.strictEqual(bobDecrypted3, 'Awesome! End-to-End Encryption verified.');
  console.log('[PASS] Test 5: Alice -> Bob Symmetric & DH Ratchet Turn 3');

  console.log('======================================================');
  console.log('ALL 5 CRYPTOGRAPHIC SUITE TESTS PASSED SUCCESSFULLY');
  console.log('======================================================');
}

testCryptoSuite();
