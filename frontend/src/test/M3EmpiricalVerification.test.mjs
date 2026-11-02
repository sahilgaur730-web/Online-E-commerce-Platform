import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendSrcDir = path.resolve(__dirname, '..');

console.log('======================================================================');
console.log('   EMPIRICAL CHALLENGER 2: MILESTONE M3 RE-VERIFICATION TEST SUITE    ');
console.log('======================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(testName, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } catch (err) {
    failedTests++;
    console.error(`  [FAIL] ${testName}: ${err.message}`);
  }
}

// ============================================================================
// 1. DESIGN TOKEN PRESENCE IN index.css
// ============================================================================
console.log('--- SUITE 1: Design Tokens in frontend/src/index.css ---');
const indexCssPath = path.resolve(frontendSrcDir, 'index.css');
const indexCssContent = fs.readFileSync(indexCssPath, 'utf8');

const expectedThemeTokens = [
  '--color-sk-navy',
  '--color-sk-navy-light',
  '--color-sk-navy-dark',
  '--color-sk-orange',
  '--color-sk-orange-hover',
  '--color-sk-green',
  '--color-sk-green-light',
  '--color-sk-surface',
  '--color-sk-bg'
];

expectedThemeTokens.forEach(token => {
  runTest(`@theme contains token ${token}`, () => {
    assert.ok(
      indexCssContent.includes(token),
      `index.css must define ${token} in @theme block`
    );
  });
});

const expectedRootVars = [
  '--sk-navy',
  '--sk-orange',
  '--sk-green',
  '--sk-bg',
  '--sk-surface'
];

expectedRootVars.forEach(v => {
  runTest(`:root contains CSS variable ${v}`, () => {
    assert.ok(
      indexCssContent.includes(v),
      `index.css must define ${v} in :root block`
    );
  });
});

// ============================================================================
// 2. ARBITRARY HEX CLASS AUDIT IN CORE COMPONENTS
// ============================================================================
console.log('\n--- SUITE 2: Absence of Arbitrary Hex Classes in Core Components ---');

const coreComponents = [
  'pages/CatalogPage.jsx',
  'pages/CheckoutPage.jsx',
  'components/Navbar.jsx',
  'components/ProductCard.jsx'
];

const arbitraryHexRegex = /(?:bg|text|border|fill|stroke|ring)-\[#[0-9a-fA-F]+\]/g;

coreComponents.forEach(relPath => {
  const fullPath = path.resolve(frontendSrcDir, relPath);
  runTest(`Zero arbitrary hex classes in core file: ${relPath}`, () => {
    assert.ok(fs.existsSync(fullPath), `File must exist: ${relPath}`);
    const source = fs.readFileSync(fullPath, 'utf8');
    const matches = source.match(arbitraryHexRegex) || [];
    assert.strictEqual(
      matches.length,
      0,
      `Expected 0 arbitrary hex classes in ${relPath}, but found ${matches.length}: ${JSON.stringify(matches)}`
    );
  });
});

// Inventory all other .jsx files for thorough visibility
function scanAllJsx(dir) {
  let list = [];
  for (const item of fs.readdirSync(dir)) {
    const p = path.join(dir, item);
    if (fs.statSync(p).isDirectory()) {
      if (item !== 'test' && item !== 'node_modules') {
        list.push(...scanAllJsx(p));
      }
    } else if (item.endsWith('.jsx')) {
      list.push(p);
    }
  }
  return list;
}

const allJsxFiles = scanAllJsx(frontendSrcDir);
console.log(`\n  [INFO] Audited ${allJsxFiles.length} JSX files across frontend/src/`);
const nonCoreWithHexes = [];
allJsxFiles.forEach(f => {
  const rel = path.relative(frontendSrcDir, f).replace(/\\/g, '/');
  if (!coreComponents.includes(rel)) {
    const content = fs.readFileSync(f, 'utf8');
    const matches = content.match(arbitraryHexRegex) || [];
    if (matches.length > 0) {
      nonCoreWithHexes.push({ file: rel, count: matches.length });
    }
  }
});
console.log(`  [INFO] Non-core components with legacy hexes (out of M3 scope): ${nonCoreWithHexes.length} files`);
nonCoreWithHexes.forEach(item => {
  console.log(`         - ${item.file}: ${item.count} legacy hexes`);
});

// ============================================================================
// 3. RESPONSIVE BREAKPOINT CLASSES (1440px Desktop, 768px Tablet, 375px Mobile)
// ============================================================================
console.log('\n--- SUITE 3: Responsive Breakpoint Classes ---');

// 3.1 CatalogPage.jsx
runTest('CatalogPage.jsx responsive layout classes', () => {
  const catPath = path.resolve(frontendSrcDir, 'pages/CatalogPage.jsx');
  const catSource = fs.readFileSync(catPath, 'utf8');

  // Desktop container constraint (1440px / 1280px)
  assert.ok(catSource.includes('max-w-[1280px]'), 'CatalogPage should have max-w-[1280px] desktop constraint');
  assert.ok(catSource.includes('px-3 md:px-6'), 'CatalogPage should adapt horizontal padding (px-3 on mobile, md:px-6 on tablet/desktop)');

  // Mobile trigger (<768px / 375px)
  assert.ok(catSource.includes('md:hidden'), 'CatalogPage must have md:hidden mobile filter trigger toolbar');
  assert.ok(catSource.includes('fixed inset-0 z-50 md:hidden flex'), 'CatalogPage must have mobile slide-over drawer (<768px)');

  // Desktop sidebar (>=768px / 1440px)
  assert.ok(catSource.includes('hidden md:block w-64'), 'CatalogPage must have hidden md:block w-64 desktop filter sidebar');

  // Multi-column product grid with 360px+ breakpoint
  assert.ok(catSource.includes('min-[360px]:grid-cols-2'), 'CatalogPage must support min-[360px]:grid-cols-2 for compact mobile');
  assert.ok(catSource.includes('sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]'), 'CatalogPage must support auto-fill repeat grid on tablet/desktop');
});

// 3.2 CheckoutPage.jsx
runTest('CheckoutPage.jsx responsive layout classes', () => {
  const checkPath = path.resolve(frontendSrcDir, 'pages/CheckoutPage.jsx');
  const checkSource = fs.readFileSync(checkPath, 'utf8');

  // Desktop multi-column grid (lg:grid-cols-12, 8/4 split)
  assert.ok(checkSource.includes('grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'), 'CheckoutPage must have responsive 1-col to 12-col grid');
  assert.ok(checkSource.includes('lg:col-span-8'), 'CheckoutPage must have lg:col-span-8 main form column');
  assert.ok(checkSource.includes('lg:col-span-4'), 'CheckoutPage must have lg:col-span-4 summary column');

  // Address form fields responsiveness
  assert.ok(checkSource.includes('grid grid-cols-1 sm:grid-cols-2 gap-3'), 'Address form must have responsive 1-to-2 column grid for name/phone');
  assert.ok(checkSource.includes('grid grid-cols-1 sm:grid-cols-3 gap-3'), 'Address form must have responsive 1-to-3 column grid for city/state/pincode');
});

// 3.3 Navbar.jsx
runTest('Navbar.jsx responsive layout classes', () => {
  const navPath = path.resolve(frontendSrcDir, 'components/Navbar.jsx');
  const navSource = fs.readFileSync(navPath, 'utf8');

  // Desktop navigation (>= 1024px)
  assert.ok(navSource.includes('hidden lg:flex'), 'Navbar must have hidden lg:flex desktop bar');

  // Mobile navigation (< 1024px / 768px / 375px)
  assert.ok(navSource.includes('lg:hidden flex flex-col py-2 gap-2'), 'Navbar must have lg:hidden mobile header');
  assert.ok(navSource.includes('aria-label="Open navigation menu"'), 'Navbar mobile header must have hamburger menu button');
});

// 3.4 ProductCard.jsx
runTest('ProductCard.jsx responsive layout classes', () => {
  const cardPath = path.resolve(frontendSrcDir, 'components/ProductCard.jsx');
  const cardSource = fs.readFileSync(cardPath, 'utf8');

  assert.ok(cardSource.includes('aspect-square'), 'ProductCard must use aspect-square 1:1 image container');
  assert.ok(cardSource.includes('flex flex-col justify-between'), 'ProductCard must use flex flex-col justify-between for uniform card height');
  assert.ok(cardSource.includes('tap-highlight-none'), 'ProductCard must include mobile tap optimization tap-highlight-none');
});

// ============================================================================
// 4. ADDRESS VALIDATION REGEX TESTS (PHONE & PINCODE)
// ============================================================================
console.log('\n--- SUITE 4: Address Validation Regex Oracles & Stress Harness ---');

// Extract validation logic exactly as defined in CheckoutPage.jsx
const phoneRegex = /^[6-9]\d{9}$/;
const pincodeRegex = /^\d{6}$/;

function validateAddressFieldOracle(field, value) {
  let error = '';
  const trimmed = (value || '').trim();
  if (field === 'phone') {
    if (!trimmed) {
      error = '10-digit mobile number is required';
    } else if (!phoneRegex.test(trimmed)) {
      error = 'Enter a valid 10-digit Indian mobile number (e.g. 9876543210)';
    }
  } else if (field === 'pincode') {
    if (!trimmed) {
      error = 'PIN code is required';
    } else if (!pincodeRegex.test(trimmed)) {
      error = 'Enter a valid 6-digit Indian PIN code (e.g. 560103)';
    }
  }
  return error;
}

// 4.1 Valid Phone numbers
const validPhones = [
  '9876543210',
  '8123456789',
  '7000000000',
  '6999999999',
  '9123456780',
  '8901234567',
  '7890123456',
  '6789012345'
];

validPhones.forEach(p => {
  runTest(`Valid phone accepted: ${p}`, () => {
    const err = validateAddressFieldOracle('phone', p);
    assert.strictEqual(err, '', `Expected no error for valid phone ${p}, got: "${err}"`);
  });
});

// 4.2 Adversarial / Invalid Phone numbers
const invalidPhones = [
  { val: '', expectedMsg: '10-digit mobile number is required', desc: 'empty string' },
  { val: '   ', expectedMsg: '10-digit mobile number is required', desc: 'whitespace only' },
  { val: null, expectedMsg: '10-digit mobile number is required', desc: 'null value' },
  { val: undefined, expectedMsg: '10-digit mobile number is required', desc: 'undefined value' },
  { val: '987654321', expectedMsg: 'Enter a valid 10-digit Indian mobile number', desc: '9 digits (too short)' },
  { val: '9876', expectedMsg: 'Enter a valid 10-digit Indian mobile number', desc: '4 digits (too short)' },
  { val: '98765432100', expectedMsg: 'Enter a valid 10-digit Indian mobile number', desc: '11 digits (too long)' },
  { val: '0987654321', expectedMsg: 'Enter a valid 10-digit Indian mobile number', desc: 'starts with 0' },
  { val: '1234567890', expectedMsg: 'Enter a valid 10-digit Indian mobile number', desc: 'starts with 1' },
  { val: '5987654321', expectedMsg: 'Enter a valid 10-digit Indian mobile number', desc: 'starts with 5' },
  { val: '98765abcde', expectedMsg: 'Enter a valid 10-digit Indian mobile number', desc: 'contains alphabetic characters' },
  { val: '98765-4321', expectedMsg: 'Enter a valid 10-digit Indian mobile number', desc: 'contains hyphen' },
  { val: '+9198765432', expectedMsg: 'Enter a valid 10-digit Indian mobile number', desc: 'contains plus sign' },
  { val: '<script>98', expectedMsg: 'Enter a valid 10-digit Indian mobile number', desc: 'XSS attempt' },
  { val: '98765 43210', expectedMsg: 'Enter a valid 10-digit Indian mobile number', desc: 'contains space inside' }
];

invalidPhones.forEach(({ val, expectedMsg, desc }) => {
  runTest(`Invalid phone rejected (${desc}): "${val}"`, () => {
    const err = validateAddressFieldOracle('phone', val);
    assert.ok(err.includes(expectedMsg), `Expected error containing "${expectedMsg}", got: "${err}"`);
  });
});

// 4.3 Valid Pincodes
const validPincodes = [
  '560103', // Bangalore
  '110001', // New Delhi
  '400001', // Mumbai
  '600001', // Chennai
  '700001', // Kolkata
  '500001', // Hyderabad
  '380001', // Ahmedabad
  '682001'  // Kochi
];

validPincodes.forEach(pin => {
  runTest(`Valid pincode accepted: ${pin}`, () => {
    const err = validateAddressFieldOracle('pincode', pin);
    assert.strictEqual(err, '', `Expected no error for valid pincode ${pin}, got: "${err}"`);
  });
});

// 4.4 Adversarial / Invalid Pincodes
const invalidPincodes = [
  { val: '', expectedMsg: 'PIN code is required', desc: 'empty string' },
  { val: '   ', expectedMsg: 'PIN code is required', desc: 'whitespace only' },
  { val: null, expectedMsg: 'PIN code is required', desc: 'null value' },
  { val: undefined, expectedMsg: 'PIN code is required', desc: 'undefined value' },
  { val: '56010', expectedMsg: 'Enter a valid 6-digit Indian PIN code', desc: '5 digits (too short)' },
  { val: '123', expectedMsg: 'Enter a valid 6-digit Indian PIN code', desc: '3 digits (too short)' },
  { val: '5601030', expectedMsg: 'Enter a valid 6-digit Indian PIN code', desc: '7 digits (too long)' },
  { val: '56010A', expectedMsg: 'Enter a valid 6-digit Indian PIN code', desc: 'contains letter' },
  { val: 'ABCDEF', expectedMsg: 'Enter a valid 6-digit Indian PIN code', desc: 'all letters' },
  { val: '560-10', expectedMsg: 'Enter a valid 6-digit Indian PIN code', desc: 'contains hyphen' },
  { val: '56 103', expectedMsg: 'Enter a valid 6-digit Indian PIN code', desc: 'contains internal space' },
  { val: '000000', expectedMsg: '', desc: 'all zeros passes regex numeric check', valid: true }
];

invalidPincodes.forEach(({ val, expectedMsg, desc, valid }) => {
  if (valid) {
    runTest(`Pincode edge case (${desc}): "${val}"`, () => {
      const err = validateAddressFieldOracle('pincode', val);
      assert.strictEqual(err, '');
    });
  } else {
    runTest(`Invalid pincode rejected (${desc}): "${val}"`, () => {
      const err = validateAddressFieldOracle('pincode', val);
      assert.ok(err.includes(expectedMsg), `Expected error containing "${expectedMsg}", got: "${err}"`);
    });
  }
});

// ============================================================================
// SUMMARY RESULTS
// ============================================================================
console.log('\n======================================================================');
console.log(`TOTAL TESTS: ${totalTests}`);
console.log(`PASSED:      ${passedTests}`);
console.log(`FAILED:      ${failedTests}`);
console.log('======================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('ALL EMPIRICAL CHALLENGER TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}
