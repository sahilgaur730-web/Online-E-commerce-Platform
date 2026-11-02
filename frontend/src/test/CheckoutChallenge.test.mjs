import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../..');

console.log('=== SHOPKART M3 CHALLENGER & REMEDIATION COMPLIANCE SUITE ===');

// 1. Read CheckoutPage.jsx source directly for static & empirical structural analysis
const checkoutPagePath = path.resolve(rootDir, 'frontend/src/pages/CheckoutPage.jsx');
const checkoutSource = fs.readFileSync(checkoutPagePath, 'utf8');

console.log('Source loaded:', checkoutPagePath, `(${checkoutSource.length} bytes)`);

// Test 1: Overlay attributes & pointer intercept verification
console.log('\n--- Challenge 1: Payment Processing Overlay Verification ---');

const overlayRegex = /\{\/\* SECURE PAYMENT PROCESSING OVERLAY \*\/\}\s*\{isSubmitting && \(\s*<div\s+([^>]+)>/;
const overlayMatch = checkoutSource.match(overlayRegex);
assert.ok(overlayMatch, 'Processing overlay with isSubmitting condition must exist');
const overlayProps = overlayMatch[1];

assert.ok(overlayProps.includes('role="status"'), 'Overlay must have role="status"');
assert.ok(overlayProps.includes('aria-live="polite"'), 'Overlay must have aria-live="polite"');
assert.ok(overlayProps.includes('fixed inset-0'), 'Overlay must cover full screen (fixed inset-0)');
assert.ok(overlayProps.includes('z-50'), 'Overlay must have high z-index (z-50)');
assert.ok(!overlayProps.includes('pointer-events-none'), 'Overlay MUST NOT have pointer-events-none (must block background pointer clicks)');

console.log('  [PASS] Processing overlay has full-screen fixed inset-0 z-50 backdrop');
console.log('  [PASS] Processing overlay does NOT have pointer-events-none (captures pointer events)');
console.log('  [PASS] Processing overlay has role="status" and aria-live="polite"');

// Check that buttons are explicitly disabled
const payButtonRegex = /<button\s+onClick=\{handlePlaceOrder\}\s+disabled=\{isSubmitting\}/;
assert.ok(payButtonRegex.test(checkoutSource), 'Main Pay button must be explicitly disabled={isSubmitting}');

const otpButtonRegex = /<button\s+onClick=\{executeOrderPlacement\}\s+disabled=\{isSubmitting\}/;
assert.ok(otpButtonRegex.test(checkoutSource), 'OTP Verify button must be explicitly disabled={isSubmitting}');

const retryButtonRegex = /<button[\s\S]*?onClick=\{handleRetryPayment\}[\s\S]*?disabled=\{isSubmitting\}/;
assert.ok(retryButtonRegex.test(checkoutSource), 'Retry Payment button must be explicitly disabled={isSubmitting}');

console.log('  [PASS] "Pay & Confirm" button is explicitly disabled={isSubmitting}');
console.log('  [PASS] "Verify OTP & Authorize Payment" button is explicitly disabled={isSubmitting}');
console.log('  [PASS] "Retry Payment" button is explicitly disabled={isSubmitting}');


// Test 2: Synchronous Re-entry Guards in Submission Handlers
console.log('\n--- Challenge 2: Synchronous Re-entry Guards in Handlers ---');

const execGuardRegex = /const executeOrderPlacement = async \(\) => \{\s*if \(isSubmitting\) return;/;
assert.ok(execGuardRegex.test(checkoutSource), 'executeOrderPlacement must have synchronous if (isSubmitting) return; guard');

const placeOrderGuardRegex = /const handlePlaceOrder = async \(\) => \{\s*if \(isSubmitting\) return;/;
assert.ok(placeOrderGuardRegex.test(checkoutSource), 'handlePlaceOrder must have synchronous if (isSubmitting) return; guard');

const retryGuardRegex = /const handleRetryPayment = async \(\) => \{\s*if \(isSubmitting\) return;/;
assert.ok(retryGuardRegex.test(checkoutSource), 'handleRetryPayment must have synchronous if (isSubmitting) return; guard');

console.log('  [PASS] executeOrderPlacement has synchronous re-entry guard: if (isSubmitting) return;');
console.log('  [PASS] handlePlaceOrder has synchronous re-entry guard: if (isSubmitting) return;');
console.log('  [PASS] handleRetryPayment has synchronous re-entry guard: if (isSubmitting) return;');


// Test 3: Dedicated Payment Failure Modal ARIA & Recovery Actions
console.log('\n--- Challenge 3: Payment Failure Modal ARIA & Recovery Actions ---');

const failureModalRegex = /\{\/\* DEDICATED PAYMENT FAILURE VIEW \/ MODAL \*\/\}\s*\{paymentFailure && \(\s*<div\s+([^>]+)>/;
const failureModalMatch = checkoutSource.match(failureModalRegex);
assert.ok(failureModalMatch, 'Dedicated payment failure modal must exist');
const failureModalProps = failureModalMatch[1];

assert.ok(failureModalProps.includes('role="alertdialog"'), 'Failure modal must have role="alertdialog"');
assert.ok(failureModalProps.includes('aria-modal="true"'), 'Failure modal must have aria-modal="true"');
assert.ok(failureModalProps.includes('aria-labelledby="payment-failure-title"'), 'Failure modal must have aria-labelledby="payment-failure-title"');
assert.ok(checkoutSource.includes('id="payment-failure-title"'), 'Matching heading id="payment-failure-title" must exist');

console.log('  [PASS] Failure modal has role="alertdialog", aria-modal="true", and aria-labelledby="payment-failure-title"');

assert.ok(checkoutSource.includes('onClick={handleRetryPayment}'), 'Modal must have Retry Payment action button');
assert.ok(checkoutSource.includes('onClick={handleChangePaymentMethod}'), 'Modal must have Change Payment Method action button');
assert.ok(checkoutSource.includes('onClick={handleBackToCartAction}'), 'Modal must have Back to Cart action button');

console.log('  [PASS] Modal includes Retry Payment, Change Payment Method, and Back to Cart CTAs');


// Test 4: Verify Zero Residual alert() in CheckoutPage.jsx
console.log('\n--- Challenge 4: Verify Zero Residual alert() in CheckoutPage.jsx ---');

const alertRegex = /(?<![A-Za-z0-9_])alert\s*\(/;
assert.ok(!alertRegex.test(checkoutSource), 'CheckoutPage.jsx must NOT call window alert()');
console.log('  [PASS] Zero residual alert() calls found in CheckoutPage.jsx');


// Test 5: Cart preservation on payment failure
console.log('\n--- Challenge 5: Cart State Preservation on Failure ---');

const executeOrderPlacementStart = checkoutSource.indexOf('const executeOrderPlacement = async () => {');
const executeOrderPlacementEnd = checkoutSource.indexOf('const handleRetryPayment = async () => {');
const executeOrderPlacementBlock = checkoutSource.slice(executeOrderPlacementStart, executeOrderPlacementEnd);

const clearCartIndex = executeOrderPlacementBlock.indexOf('await clearCart()');
const catchIndex = executeOrderPlacementBlock.indexOf('catch (err)');
assert.ok(clearCartIndex > 0, 'clearCart must be called on successful completion');
assert.ok(catchIndex > 0, 'catch block must exist');
assert.ok(clearCartIndex < catchIndex, 'clearCart() must only be called in try block before catch (never on error)');

console.log('  [PASS] clearCart() is situated in try block after verification; cart state is preserved on failure');


// Test 6: Failure Message Property Mapping & Fallback Rendering
console.log('\n--- Challenge 6: Failure Message Property Mapping & Fallback Rendering ---');

// State creation in catch block
const stateSettingRegex = /setPaymentFailure\(\{([^}]+)\}\)/;
const stateSettingMatch = executeOrderPlacementBlock.match(stateSettingRegex);
assert.ok(stateSettingMatch, 'setPaymentFailure call must exist in catch block');
const stateProperties = stateSettingMatch[1];

const hasReasonProp = stateProperties.includes('reason:');
const hasMessageProp = stateProperties.includes('message:');
assert.ok(hasReasonProp, 'paymentFailure state object must contain reason property');
assert.ok(hasMessageProp, 'paymentFailure state object must contain message property');

console.log('  [PASS] State setting assigns both reason and message properties');

// Check JSX rendering of failure message in modal
const failureReasonNoticeRegex = /\{\/\*\s*Error Reason Notice\s*\*\/\}[\s\S]*?<div[^>]*>[\s\S]*?<p[^>]*>Reason for Failure:<\/p>[\s\S]*?<p[^>]*>\{paymentFailure\.([^}]+)\}<\/p>/;
const jsxReasonMatch = checkoutSource.match(failureReasonNoticeRegex);

assert.ok(jsxReasonMatch, 'JSX Error Reason Notice block must be present');
const accessedProp = jsxReasonMatch[1];
assert.ok(
  accessedProp.includes('reason') || accessedProp.includes('message'),
  'JSX must render paymentFailure.reason || paymentFailure.message'
);

console.log('  [PASS] Modal JSX renders paymentFailure.' + accessedProp + ' ensuring clear failure description');


// Test 7: Retry Payment State Reset Verification
console.log('\n--- Challenge 7: Retry Payment State Reset Verification ---');
const retryMethodStart = checkoutSource.indexOf('const handleRetryPayment = async () => {');
const retryMethodEnd = checkoutSource.indexOf('const handleChangePaymentMethod = () => {');
const retryMethodBlock = checkoutSource.slice(retryMethodStart, retryMethodEnd);

assert.ok(retryMethodBlock.includes('setPaymentFailure(null)'), 'handleRetryPayment must reset paymentFailure state to null');
assert.ok(retryMethodBlock.includes('executeOrderPlacement()'), 'handleRetryPayment must trigger executeOrderPlacement for re-attempt');
console.log('  [PASS] handleRetryPayment resets paymentFailure to null and triggers re-attempt');

console.log('\n=== ALL M3 CHALLENGER & REMEDIATION TESTS PASSED ===');
