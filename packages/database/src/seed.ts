import { PrismaClient } from '@prisma/client';
import { Curve25519 } from '@securechat/crypto';
import * as crypto from 'node:crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'securechat_salt_2026').digest('hex');
}

async function main() {
  console.log('Seeding SecureChat database baseline...');

  // 1. Create Demo Users
  const aliceKeyPair = Curve25519.generateKeyPair();
  const bobKeyPair = Curve25519.generateKeyPair();
  const adminKeyPair = Curve25519.generateKeyPair();

  const alice = await prisma.user.upsert({
    where: { username: 'alice' },
    update: { passwordHash: hashPassword('Password123!') },
    create: {
      username: 'alice',
      email: 'alice@securechat.internal',
      phone: '+923001111111',
      displayName: 'Alice Vance',
      passwordHash: hashPassword('Password123!'),
      role: 'SECURITY_USER',
      status: 'ACTIVE',
      userPreference: {
        create: {
          aiMode: 'GUARDIAN',
          enableDlp: true,
          enablePhishing: true,
          enableSocialEng: true,
        },
      },
      devices: {
        create: {
          deviceId: 'DEV-ALICE-ANDROID-001',
          deviceType: 'ANDROID',
          deviceName: 'Pixel 9 Pro (SecureChat)',
          publicKey: aliceKeyPair.publicKey,
          identityKeys: {
            create: {
              publicKey: aliceKeyPair.publicKey,
              signedPreKey: aliceKeyPair.publicKey,
              signedPreKeyId: 1,
              signedPreKeySignature: 'SIG_ALICE_PREKEY_001',
            },
          },
        },
      },
    },
    include: { devices: true },
  });

  const bob = await prisma.user.upsert({
    where: { username: 'bob' },
    update: { passwordHash: hashPassword('Password123!') },
    create: {
      username: 'bob',
      email: 'bob@securechat.internal',
      phone: '+923002222222',
      displayName: 'Bob Martinez',
      passwordHash: hashPassword('Password123!'),
      role: 'USER',
      status: 'ACTIVE',
      userPreference: {
        create: {
          aiMode: 'BALANCED',
          enableDlp: true,
          enablePhishing: true,
          enableSocialEng: true,
        },
      },
      devices: {
        create: {
          deviceId: 'DEV-BOB-ANDROID-002',
          deviceType: 'ANDROID',
          deviceName: 'Galaxy S24 (Bob)',
          publicKey: bobKeyPair.publicKey,
          identityKeys: {
            create: {
              publicKey: bobKeyPair.publicKey,
              signedPreKey: bobKeyPair.publicKey,
              signedPreKeyId: 1,
              signedPreKeySignature: 'SIG_BOB_PREKEY_001',
            },
          },
        },
      },
    },
    include: { devices: true },
  });

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { passwordHash: hashPassword('AdminPass2026!') },
    create: {
      username: 'admin',
      email: 'admin@securechat.internal',
      displayName: 'SecOps Administrator',
      passwordHash: hashPassword('AdminPass2026!'),
      role: 'ADMIN',
      status: 'ACTIVE',
      userPreference: {
        create: {
          aiMode: 'GUARDIAN',
          enableDlp: true,
          enablePhishing: true,
          enableSocialEng: true,
        },
      },
      devices: {
        create: {
          deviceId: 'DEV-ADMIN-WORKSTATION-001',
          deviceType: 'DESKTOP',
          deviceName: 'SecOps Linux Workstation',
          publicKey: adminKeyPair.publicKey,
        },
      },
    },
    include: { devices: true },
  });

  const asadKeyPair = Curve25519.generateKeyPair();
  const sinnerKeyPair = Curve25519.generateKeyPair();

  const asad = await prisma.user.upsert({
    where: { username: '03210008941' },
    update: { passwordHash: hashPassword('Password123!') },
    create: {
      username: '03210008941',
      phone: '+923210008941',
      displayName: 'Muhammad Asad',
      passwordHash: hashPassword('Password123!'),
      role: 'ADMIN',
      status: 'ACTIVE',
      userPreference: {
        create: {
          aiMode: 'GUARDIAN',
          enableDlp: true,
          enablePhishing: true,
          enableSocialEng: true,
        },
      },
      devices: {
        create: {
          deviceId: 'DEV-ASAD-WEB-001',
          deviceType: 'WEB',
          deviceName: 'Muhammad Asad Browser',
          publicKey: asadKeyPair.publicKey,
          identityKeys: {
            create: {
              publicKey: asadKeyPair.publicKey,
              signedPreKey: asadKeyPair.publicKey,
              signedPreKeyId: 1,
              signedPreKeySignature: 'SIG_ASAD_PREKEY_001',
            },
          },
        },
      },
    },
    include: { devices: true },
  });

  const sinner = await prisma.user.upsert({
    where: { username: 'sinner' },
    update: { passwordHash: hashPassword('Password123!') },
    create: {
      username: 'sinner',
      phone: '+923009998877',
      displayName: 'GMX Sinner',
      passwordHash: hashPassword('Password123!'),
      role: 'ADMIN',
      status: 'ACTIVE',
      userPreference: {
        create: {
          aiMode: 'GUARDIAN',
          enableDlp: true,
          enablePhishing: true,
          enableSocialEng: true,
        },
      },
      devices: {
        create: {
          deviceId: 'DEV-SINNER-WEB-001',
          deviceType: 'WEB',
          deviceName: 'GMX Sinner Browser',
          publicKey: sinnerKeyPair.publicKey,
          identityKeys: {
            create: {
              publicKey: sinnerKeyPair.publicKey,
              signedPreKey: sinnerKeyPair.publicKey,
              signedPreKeyId: 1,
              signedPreKeySignature: 'SIG_SINNER_PREKEY_001',
            },
          },
        },
      },
    },
    include: { devices: true },
  });

  // 2. Create Contacts
  await prisma.contact.upsert({
    where: { ownerUserId_contactUserId: { ownerUserId: alice.id, contactUserId: bob.id } },
    update: {},
    create: {
      ownerUserId: alice.id,
      contactUserId: bob.id,
      trustState: 'VERIFIED',
    },
  });

  await prisma.contact.upsert({
    where: { ownerUserId_contactUserId: { ownerUserId: bob.id, contactUserId: alice.id } },
    update: {},
    create: {
      ownerUserId: bob.id,
      contactUserId: alice.id,
      trustState: 'VERIFIED',
    },
  });

  await prisma.contact.upsert({
    where: { ownerUserId_contactUserId: { ownerUserId: asad.id, contactUserId: sinner.id } },
    update: {},
    create: {
      ownerUserId: asad.id,
      contactUserId: sinner.id,
      trustState: 'VERIFIED',
    },
  });

  await prisma.contact.upsert({
    where: { ownerUserId_contactUserId: { ownerUserId: sinner.id, contactUserId: asad.id } },
    update: {},
    create: {
      ownerUserId: sinner.id,
      contactUserId: asad.id,
      trustState: 'VERIFIED',
    },
  });

  // 3. Create Sample Direct Conversation between Alice and Bob
  const conversation = await prisma.conversation.create({
    data: {
      type: 'DIRECT',
      members: {
        create: [
          { userId: alice.id, role: 'MEMBER' },
          { userId: bob.id, role: 'MEMBER' },
        ],
      },
      aiContexts: {
        create: [
          {
            userId: alice.id,
            summary: 'Active secure channel established between Alice and Bob.',
            currentRiskScore: 0,
            currentSecurityState: 'GREEN',
            observations: JSON.stringify(['Verified cryptographic keys', 'No security violations']),
          },
          {
            userId: bob.id,
            summary: 'Active secure channel established between Bob and Alice.',
            currentRiskScore: 0,
            currentSecurityState: 'GREEN',
            observations: JSON.stringify(['Verified cryptographic keys', 'No security violations']),
          },
        ],
      },
    },
  });

  // 4. Create Initial Sample Security Events
  await prisma.securityEvent.create({
    data: {
      userId: alice.id,
      conversationId: conversation.id,
      type: 'DLP_SECRET_EXPOSURE',
      severity: 'LOW',
      riskScore: 15,
      indicatorColor: 'GREEN',
      confidence: 0.98,
      source: 'RULE_ENGINE',
      explanation: 'Pre-send scan verified message was safe with no leaked secrets.',
      recommendation: 'Normal communication safe to proceed.',
    },
  });

  console.log(`Database seeded successfully!
- Alice: username 'alice', password 'Password123!'
- Bob: username 'bob', password 'Password123!'
- Admin: username 'admin', password 'AdminPass2026!'
- Conversation ID: ${conversation.id}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
