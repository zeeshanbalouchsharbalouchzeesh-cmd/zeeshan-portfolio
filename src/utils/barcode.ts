/**
 * Barcode utilities for ShopMaster:
 * - Code 128 and EAN-13 SVG barcode rendering
 * - Unique internal barcode generation
 * - Hardware USB/Bluetooth scanner keypress buffer detection
 */

// Simple robust Code 128B pattern generator
const CODE128_PATTERNS: { [char: string]: string } = {
  ' ': '11011001100', '!': '11001101100', '"': '11001100110', '#': '10010011000',
  '$': '10010001100', '%': '10001001100', '&': '10011001000', '\'': '10011000100',
  '(': '10001100100', ')': '11001001000', '*': '11001000100', '+': '11000100100',
  ',': '10110011100', '-': '10011011100', '.': '10011001110', '/': '10111001100',
  '0': '10011101100', '1': '10011100110', '2': '11001110010', '3': '11001011100',
  '4': '11001001110', '5': '11011100100', '6': '11001110100', '7': '11101101110',
  '8': '11101001100', '9': '11100101100', ':': '11100100110', ';': '11101100100',
  '<': '11100110100', '=': '11100110010', '>': '11011011000', '?': '11011000110',
  '@': '11000110110', 'A': '10100011000', 'B': '10001011000', 'C': '10001000110',
  'D': '10110001000', 'E': '10001101000', 'F': '10001100010', 'G': '11010001000',
  'H': '11000101000', 'I': '11000100010', 'J': '10110111000', 'K': '10110001110',
  'L': '10001101110', 'M': '10111011000', 'N': '10111000110', 'O': '10001110110',
  'P': '11101110110', 'Q': '11010001110', 'R': '11000101110', 'S': '11011101000',
  'T': '11011100010', 'U': '11011101110', 'V': '11101011000', 'W': '11101000110',
  'X': '11100010110', 'Y': '11101101000', 'Z': '11101100010', '[': '11100011010',
  '\\': '11101111010', ']': '11001000010', '^': '11110001010', '_': '10100110000',
};

/**
 * Generates an SVG string representation of a Code 128 barcode
 */
export function generateBarcodeSvg(
  text: string,
  width: number = 220,
  height: number = 70,
  includeText: boolean = true
): string {
  const clean = text.toUpperCase().replace(/[^A-Z0-9\-.]/g, '');
  const data = clean.length > 0 ? clean : 'SHOPMASTER';

  // Build binary bars
  let binary = '11010010000'; // Start Code B
  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    binary += CODE128_PATTERNS[char] || '10010011000';
  }
  binary += '1100011101011'; // Stop pattern

  const barWidth = width / binary.length;
  let rects = '';
  for (let i = 0; i < binary.length; i++) {
    if (binary[i] === '1') {
      const x = (i * barWidth).toFixed(2);
      const barHeight = includeText ? height - 18 : height;
      rects += `<rect x="${x}" y="0" width="${(barWidth + 0.1).toFixed(2)}" height="${barHeight}" fill="#0f172a" />`;
    }
  }

  const textElement = includeText
    ? `<text x="${width / 2}" y="${height - 2}" font-family="monospace" font-size="11" font-weight="600" text-anchor="middle" fill="#334155">${text}</text>`
    : '';

  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${rects}${textElement}</svg>`;
}

/**
 * Generates a unique 12-digit internal barcode with timestamp & random entropy
 */
export function generateUniqueBarcode(prefix: string = '890'): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(100 + Math.random() * 900).toString();
  const raw12 = `${prefix}${timestamp}${random}`.slice(0, 12);
  
  // Calculate EAN-13 check digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(raw12[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const mod = sum % 10;
  const checkDigit = mod === 0 ? 0 : 10 - mod;
  return `${raw12}${checkDigit}`;
}

/**
 * Hardware Scanner Listener Hook
 * Hardware USB and Bluetooth barcode scanners act as high-speed keyboards.
 * Characters arrive within 20-50ms of each other, followed by 'Enter'.
 */
export class HardwareScannerListener {
  private buffer: string = '';
  private lastTime: number = 0;
  private onScanCallback: (barcode: string) => void;
  private keydownHandler: (e: KeyboardEvent) => void;

  constructor(onScan: (barcode: string) => void) {
    this.onScanCallback = onScan;
    this.keydownHandler = this.handleKeyDown.bind(this);
  }

  public start() {
    window.addEventListener('keydown', this.keydownHandler);
  }

  public stop() {
    window.removeEventListener('keydown', this.keydownHandler);
  }

  private handleKeyDown(e: KeyboardEvent) {
    // Ignore input if user is actively typing in a standard form input, unless it's the barcode input or fast scanner
    const target = e.target as HTMLElement;
    const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

    const currentTime = Date.now();
    const timeDiff = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Check if scanner input (fast cadence < 50ms)
    if (e.key === 'Enter') {
      if (this.buffer.length >= 3) {
        e.preventDefault();
        const scanned = this.buffer.trim();
        this.buffer = '';
        this.onScanCallback(scanned);
      } else {
        this.buffer = '';
      }
      return;
    }

    if (e.key.length === 1) {
      if (timeDiff > 70 && !isInput) {
        // Human typing or fresh start
        this.buffer = e.key;
      } else {
        this.buffer += e.key;
      }
    }
  }
}
