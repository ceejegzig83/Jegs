import { MinutiaePoint, UserRole, Suspect } from '../types';

/**
 * Fast SHA-256 implementation for audit chain hashing in the browser
 */
export async function sha256(message: string): Promise<string> {
  // Use Web Crypto API if available
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback simple hash for deterministic string calculation
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    const char = message.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

/**
 * Synchronous hash helper for instantaneous UI feedback
 */
export function quickHash(data: string): string {
  let h1 = 0xdeadbeef ^ 0;
  let h2 = 0x41c6ce57 ^ 0;
  for (let i = 0, ch; i < data.length; i++) {
    ch = data.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `${part1}${part2}${part1}${part2}${part1}${part2}${part1}${part2}`.slice(0, 64);
}

/**
 * Calculates cosine similarity between two 128-dimensional biometric embeddings.
 * Returns a value between 0.00 and 1.00.
 */
export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length === 0 || vecB.length === 0 || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.max(0, Math.min(1, similarity));
}

/**
 * Generate synthetic 128-dim biometric vector based on a seed string
 */
export function generateBiometricVector(seedStr: string): number[] {
  const vector: number[] = [];
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed += seedStr.charCodeAt(i) * (i + 1);
  }
  
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  let sumSq = 0;
  for (let i = 0; i < 128; i++) {
    const val = rand() * 2 - 1;
    vector.push(val);
    sumSq += val * val;
  }
  // Normalize vector to unit length
  const norm = Math.sqrt(sumSq) || 1;
  return vector.map(v => Number((v / norm).toFixed(5)));
}

/**
 * Generates realistic ISO/IEC 19794-2 Minutiae points around a fingerprint center
 */
export function generateMinutiaePoints(seedStr: string, count = 42): MinutiaePoint[] {
  const points: MinutiaePoint[] = [];
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) seed += seedStr.charCodeAt(i);

  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  const types: MinutiaePoint['type'][] = ['BIFURCATION', 'RIDGE_ENDING', 'BIFURCATION', 'RIDGE_ENDING', 'RIDGE_ENDING'];
  
  // Core point
  points.push({
    x: 100 + (rand() * 20 - 10),
    y: 110 + (rand() * 20 - 10),
    type: 'CORE',
    angle: Math.floor(rand() * 360),
    quality: 98,
  });

  // Delta point
  points.push({
    x: 60 + (rand() * 15),
    y: 160 + (rand() * 15),
    type: 'DELTA',
    angle: Math.floor(rand() * 360),
    quality: 92,
  });

  for (let i = 0; i < count; i++) {
    const angleRad = rand() * Math.PI * 2;
    const radius = 25 + rand() * 65;
    const x = 100 + Math.cos(angleRad) * radius * 0.8;
    const y = 110 + Math.sin(angleRad) * radius * 1.1;

    points.push({
      x: Math.round(Math.max(20, Math.min(180, x))),
      y: Math.round(Math.max(20, Math.min(200, y))),
      type: types[Math.floor(rand() * types.length)],
      angle: Math.floor(rand() * 360),
      quality: Math.round(75 + rand() * 24),
    });
  }

  return points;
}

/**
 * Apply NDPA role-based redactions to suspect data
 */
export function redactSuspectForRole(suspect: Suspect, role: UserRole): Suspect {
  // If Field officer on patrol: keep identity, active warrant, recent risk, and limited history summaries
  if (role === 'FIELD_OFFICER') {
    return {
      ...suspect,
      ninHash: suspect.ninHash.slice(0, 8) + '••••••••',
      bvnHash: suspect.bvnHash.slice(0, 8) + '••••••••',
      // Keep essential arrest titles and active warrants
      criminalRecords: suspect.criminalRecords.map(r => ({
        ...r,
        offenseDetails: '[FULL DETAILS RESTRICTED TO DESK OFFICERS/INVESTIGATORS - NDPA SEC. 24]',
      })),
    };
  }

  // NDPA Auditor: anonymizes biometric vectors for privacy compliance audit
  if (role === 'NDPA_AUDITOR') {
    return {
      ...suspect,
      firstName: suspect.firstName.charAt(0) + '••••••',
      lastName: suspect.lastName.charAt(0) + '••••••',
      biometrics: suspect.biometrics.map(b => ({
        ...b,
        vectorEmbedding: [],
        encryptedHash: '[AUDIT_ENCRYPTED_SIGNATURE_VERIFIED]',
      })),
    };
  }

  return suspect;
}
