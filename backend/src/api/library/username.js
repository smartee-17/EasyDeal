/* ============================================================
   EASYDEAL — SERVER-SIDDEN USERNAME GENERATION
   Purpose: Signup no longer collects a username, so the backend
            must mint a unique, valid one from the supplied name.

   Design notes
   - The random suffix is the uniqueness guarantee. The readable
     part is cosmetic, so a name that sanitises to nothing is fine:
     the username degrades to the random suffix alone.
   - Unpredictability matters because usernames are a login
     identifier; a sequential counter would let one account probe
     for another, so this uses crypto randomness, never a counter.
   - The existence check is injectable so the collision loop can be
     unit tested without a database or a Mongoose mock.
   ============================================================ */

import crypto from 'crypto';
import User from '../models/user.model.js';

/** Keeps the readable portion short enough that the full username
 *  stays comfortable in URLs, email greetings and profile links. */
const MAX_BASE_LENGTH = 20;

/** 5 bytes of randomness rendered as 10 hex characters. */
const SUFFIX_BYTES = 5;

/** Bounded so a pathological collision storm cannot spin forever. */
const MAX_ATTEMPTS = 10;

/**
 * Reduce a display name to the safe username alphabet:
 * lowercase ASCII letters, digits and underscores.
 *
 * Accents are decomposed and stripped ("Jose" from "José") and every
 * other run of characters collapses to a single underscore, which
 * keeps the result valid as a URL path segment and as part of an
 * email local-part.
 */
function sanitizeBase(name) {
  return String(name ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, MAX_BASE_LENGTH)
    .replace(/_+$/g, '');
}

function randomSuffix() {
  return crypto.randomBytes(SUFFIX_BYTES).toString('hex');
}

/**
 * Produce a username that is not already taken.
 *
 * @param {string} name - the user's display name, used for the readable part.
 * @param {{ exists?: (username: string) => Promise<boolean|null> }} [deps]
 *        Injectable existence probe. Defaults to the real User model.
 * @returns {Promise<string>}
 */
export async function generateUniqueUsername(name, deps = {}) {
  // Wrapped in an async arrow and awaited rather than chaining .then() so a
  // probe that returns a plain boolean (test doubles, or a mocked model)
  // behaves the same as one that returns a query promise.
  const exists =
    deps.exists ?? (async (username) => Boolean(await User.exists({ username })));

  const base = sanitizeBase(name);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const candidate = base ? `${base}_${randomSuffix()}` : randomSuffix();

    // Sequential awaits are intentional: each candidate must be proven
    // free before the next is drawn.
    // eslint-disable-next-line no-await-in-loop
    const taken = await exists(candidate);
    if (!taken) return candidate;
  }

  // Ten consecutive collisions means the random space is being attacked
  // or exhausted. Widen it rather than fail the registration or, far
  // worse, reuse a username that is already owned.
  return `${base ? `${base}_` : ''}${crypto.randomBytes(12).toString('hex')}`;
}