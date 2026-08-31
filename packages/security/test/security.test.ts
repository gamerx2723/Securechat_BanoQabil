import { DlpScanner } from '../src/dlp/dlp_scanner.js';
import { UrlAnalyzer } from '../src/url/url_analyzer.js';
import { SocialEngineeringScanner } from '../src/social/social_patterns.js';
import { RiskEngine } from '../src/risk/risk_engine.js';
import assert from 'node:assert';

function testSecuritySuite() {
  console.log('--- Running SecureChat Deterministic Security & DLP Test Suite ---');

  // Test 1: DLP Detection of AWS Key & OTP
  const dlpSample = 'Here is my AWS key: AKIAIOSFODNN7EXAMPLE and your OTP code is 493821';
  const dlpRes = DlpScanner.scan(dlpSample);
  assert.strictEqual(dlpRes.hasSensitiveData, true, 'DLP must flag sensitive credentials');
  assert.strictEqual(dlpRes.detectedItems.length, 2, 'DLP must detect both AWS key and OTP');
  console.log('[PASS] Test 1: DLP Secret & Credential Interception');

  // Test 2: URL Analyzer Lookalike Brand & Phishing TLD
  const urlSample = 'https://paypa1-verification.xyz/login-suspended';
  const urlRes = UrlAnalyzer.analyzeUrl(urlSample);
  assert.strictEqual(urlRes.hasSuspiciousTld, true, 'Must flag .xyz as suspicious TLD');
  assert.strictEqual(urlRes.typoBrandTarget, 'paypal', 'Must identify brand typosquatting targeting PayPal');
  assert.ok(urlRes.suspiciousScore >= 70, 'Suspicious score should be >= 70');
  console.log('[PASS] Test 2: Phishing Brand Spoofing & TLD Analysis');

  // Test 3: Multilingual Social Engineering (Urgency in English & Roman Urdu)
  const engUrgency = 'URGENT: Your bank account will be suspended today. Act now!';
  const urduUrgency = 'Bhai foran verify karo nahi toh account block honay wala hai';
  const engSocial = SocialEngineeringScanner.scan(engUrgency);
  const urduSocial = SocialEngineeringScanner.scan(urduUrgency);
  assert.ok(engSocial.some(e => e.category === 'URGENCY_MANIPULATION'), 'Must detect English urgency');
  assert.ok(urduSocial.some(e => e.category === 'URGENCY_MANIPULATION'), 'Must detect Roman Urdu urgency');
  console.log('[PASS] Test 3: Multilingual Urgency & Social Engineering Detection');

  // Test 4: End-to-End Risk Engine Score & Indicator Mapping
  const benignMessage = 'Good morning, looking forward to our project presentation today.';
  const benignEval = RiskEngine.evaluateMessage(benignMessage);
  assert.strictEqual(benignEval.indicatorColor, 'GREEN', 'Benign text must be GREEN');
  assert.strictEqual(benignEval.riskScore, 0, 'Benign text risk score must be 0');

  const criticalPhishing = 'URGENT: Verify your account immediately: https://paypa1-security.xyz/verify-account';
  const criticalEval = RiskEngine.evaluateMessage(criticalPhishing);
  assert.strictEqual(criticalEval.indicatorColor, 'RED', 'Urgent phishing link must be RED');
  assert.ok(criticalEval.riskScore >= 80, 'Risk score must be >= 80');
  assert.ok(criticalEval.suggestedActions.includes('BLOCK_LINK'), 'Must suggest BLOCK_LINK');
  console.log('[PASS] Test 4: Zero-Trust Risk Engine Green / Red Indicator Classification');

  console.log('======================================================');
  console.log('ALL 4 SECURITY SUITE TESTS PASSED SUCCESSFULLY');
  console.log('======================================================');
}

testSecuritySuite();
