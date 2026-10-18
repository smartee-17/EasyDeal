import { generateUniqueUsername } from '../../api/library/username.js';

// The generator takes an injectable existence probe, so the collision loop can
// be driven deterministically without a database or a Mongoose mock.
describe('generateUniqueUsername', () => {
  const USERNAME_PATTERN = /^[a-z0-9_]+$/;

  test('// should derive a readable prefix from the name', async () => {
    const username = await generateUniqueUsername('Ada Lovelace', {
      exists: async () => false,
    });
    expect(username).toMatch(/^ada_lovelace_[0-9a-f]{10}$/);
  });

  test('// should always produce a valid username', async () => {
    const names = [
      'Ada Lovelace',
      'Jean-Luc Picard',
      "O'Brien",
      '  spaced   out  ',
      'José Álvarez',
      '12345',
      '...',
      '',
      null,
      undefined,
      'A'.repeat(200),
      'user@example.com',
      'Ünïcødé Ñame',
    ];

    for (const name of names) {
      // eslint-disable-next-line no-await-in-loop
      const username = await generateUniqueUsername(name, { exists: async () => false });
      expect(typeof username).toBe('string');
      expect(username.length).toBeGreaterThan(0);
      expect(username).toMatch(USERNAME_PATTERN);
      // eslint-disable-next-line no-console
      console.log(`      ${JSON.stringify(name)} -> ${username}`);
    }
  });

  test('// should never start or end with an underscore', async () => {
    for (const name of ['  leading', 'trailing  ', '!!!mid!!!']) {
      // eslint-disable-next-line no-await-in-loop
      const username = await generateUniqueUsername(name, { exists: async () => false });
      expect(username.startsWith('_')).toBe(false);
      expect(username.endsWith('_')).toBe(false);
    }
  });

  test('// should strip accents rather than dropping the name', async () => {
    const username = await generateUniqueUsername('José', { exists: async () => false });
    expect(username).toMatch(/^jose_[0-9a-f]{10}$/);
  });

  test('// should cap the readable portion at a sane length', async () => {
    const username = await generateUniqueUsername('B'.repeat(200), {
      exists: async () => false,
    });
    const [base] = username.split('_');
    expect(base.length).toBeLessThanOrEqual(20);
  });

  test('// should fall back to the random suffix when the name sanitises to nothing', async () => {
    const username = await generateUniqueUsername('...', { exists: async () => false });
    expect(username).toMatch(/^[0-9a-f]{10}$/);
  });

  test('// should produce unique values across repeated calls', async () => {
    const seen = new Set();
    for (let i = 0; i < 50; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const username = await generateUniqueUsername('Same Name', { exists: async () => false });
      expect(seen.has(username)).toBe(false);
      seen.add(username);
    }
    expect(seen.size).toBe(50);
  });

  test('// should retry until it finds a free username', async () => {
    let calls = 0;

    const username = await generateUniqueUsername('Ada Lovelace', {
      // Reject the first two draws, accept the third.
      exists: async () => {
        calls += 1;
        return calls <= 2;
      },
    });

    expect(calls).toBe(3);
    expect(username).toMatch(/^ada_lovelace_[0-9a-f]{10}$/);
  });

  test('// should keep retrying while collisions persist', async () => {
    let calls = 0;
    const username = await generateUniqueUsername('Busy Name', {
      exists: async () => {
        calls += 1;
        return calls <= 5; // first five candidates are taken
      },
    });

    expect(calls).toBe(6);
    expect(username).toMatch(/^busy_name_[0-9a-f]{10}$/);
  });

  test('// should widen the random space rather than reuse a taken username', async () => {
    // Always report taken, exhausting the retry budget.
    const username = await generateUniqueUsername('Always Taken', {
      exists: async () => true,
    });

    // Falls back to a longer random suffix, and is still valid.
    expect(username).toMatch(/^always_taken_[0-9a-f]{24}$/);
  });

  test('// should not leak the readable name when the retry budget is exhausted', async () => {
    const username = await generateUniqueUsername('Always Taken', {
      exists: async () => true,
    });
    expect(username).not.toBe('always_taken');
  });

  test('// should accept a probe that returns a plain boolean', async () => {
    // Guards against the generator assuming the probe returns a promise.
    const username = await generateUniqueUsername('Sync Probe', {
      exists: () => false,
    });
    expect(username).toMatch(/^sync_probe_[0-9a-f]{10}$/);
  });

  test('// should not treat a null probe result as taken', async () => {
    // User.exists() resolves to null when no document matches.
    const username = await generateUniqueUsername('Null Probe', {
      exists: async () => null,
    });
    expect(username).toMatch(/^null_probe_[0-9a-f]{10}$/);
  });
});