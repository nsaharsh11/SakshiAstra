
/* =====================================================================
   SakshiAstra — demo scene data (fixtures)
   ---------------------------------------------------------------------
   HONESTY CONTRACT, encoded in the data itself:
     every evidence record carries a source badge, and the badge is
     rendered wherever the record appears. Nothing here presents a
     historical dataset as a live scan, and no fixture is unlabelled.

   VERDICT VOCABULARY (fixed, locked, signed):
     ASSERT  green   — the evidence supports it
     HOLD    amber   — the evidence does not yet support it
     REJECT  red     — the evidence contradicts it
     TAKEOVER outlined amber — key valid, operator not confirmed (always HOLD)

   CLAIM STATUS: VERIFIED / SUPPORTED / UNVERIFIED / QUESTIONABLE /
                 CONTRADICTED

   PROOF LADDER:
     L0 pasted        anyone can type this string
     L1 signed        a real signature, but it does not bind a persona
     L2 persona-bound a signature that names the handle it belongs to
     L3 fresh         + a current block height / date, re-verifiable now
   ===================================================================== */

import { attachHistoricalText } from './historical.js';
import { PRESENTER } from './presenter.js';

/* The five claims. Fixed vocabulary — the UI never invents a sixth. */
const CLAIM_TYPES = [
  { id: 'key_control', name: 'Key Control', question: 'Does this persona hold the private key?' },
  { id: 'wallet_control', name: 'Wallet Control', question: 'Does this persona control this wallet?' },
  { id: 'persona_link', name: 'Persona Link', question: 'Are these two handles the same person?' },
  { id: 'hosting_link', name: 'Hosting Link', question: 'Does this hidden service run on that origin?' },
  { id: 'same_operator', name: 'Same Operator', question: 'Is the same person still operating it?' },
];

/* Cost-to-forge scale, 0-5. The whole point of the column. */
const COST = {
  0: { bars: 0, cap: '≈0 · template on every host', level: 'COMMON' },
  1: { bars: 1, cap: '≈5 min · no skill, no secret', level: 'COPYABLE' },
  2: { bars: 2, cap: '≈1 h · no skill, no secret', level: 'CHEAP' },
  3: { bars: 3, cap: '≈2 days · writing skill', level: 'MODERATE' },
  4: { bars: 4, cap: 'requires the original private key', level: 'EXPENSIVE' },
  5: { bars: 5, cap: 'requires forging a signature', level: 'INFEASIBLE' },
};

const SRC = {
  evolution: { source_level: 'FIXTURE', badge: 'fix', label: 'FIXTURE', ref: 'Planted scenario · Market B' },
  darkforums: { source_level: 'FIXTURE', badge: 'fix', label: 'FIXTURE', ref: 'Planted scenario · Market C' },
  grams: { source_level: 'FIXTURE', badge: 'fix', label: 'FIXTURE', ref: 'Planted scenario · Market C' },
  agora: { source_level: 'FIXTURE', badge: 'fix', label: 'FIXTURE', ref: 'Planted scenario · Market A' },
  fixture: { source_level: 'FIXTURE', badge: 'fix', label: 'FIXTURE', ref: 'controlled mock hidden service' },
  onionoo: { source_level: 'FIXTURE', badge: 'fix', label: 'FIXTURE', ref: 'Planted relay metadata' },
  analyst: { source_level: 'ANALYST_INPUT', badge: 'fix', label: 'ANALYST INPUT', ref: 'submitted by analyst' },
};

const SCENES = [
  /* ==================================================================
     SCENE 1 — LOOKALIKE VENDOR  →  HOLD
     The headline: six copied observations, four signals, one origin.
     ================================================================== */
  {
    id: 'lookalike',
    n: 1,
    title: 'Lookalike vendor',
    question: 'Two handles selling the same goods on two markets. Same operator?',
    verdict: 'HOLD',
    caption: PRESENTER.find(p => p.scene === 'lookalike').caption,
    case: { id: 'SA-26151-0001', opened: '2026-09-24 11:02', analyst: 'analyst.a' },
    subjects: [
      { handle: 'merrow_supply', market: 'Market A', first: '2015-02-08', last: '2015-04-19' },
      { handle: 'merrow.supply', market: 'Market B', first: '2015-06-02', last: '2015-08-30' },
    ],
    claims: {
      persona_link: {
        status: 'UNVERIFIED',
        takeover: false,
        peak: 'L0',
        summary:
          'The two handles share a description template, a product line and a posting cadence. Sharing a template is not sharing an operator: the template is a resale pack that was widely copied, so the match collapses to a single origin.',
        falsify:
          'A signature from either handle that names the other, or a shared secret that only the operator would know.',
        evidence: [
          {
            kind: 'Description text', title: 'Listing description, 88% raw → 24% after template removal',
            detail: 'Both profiles carry the same opening block. Character-level similarity is very high, and this is the signal a similarity engine matches on.',
            status: 'supported', level: 'L0', cost: 0, origin: 'tpl-pack-v4',
            originLabel: 'Resale template pack v4',
            source: SRC.evolution, found: '2015-06-02',
          },
          {
            kind: 'Product line', title: 'Identical catalogue ordering, 14 items',
            detail: 'Same items, same sequence, same headings. Ordering looks distinctive until you find the template.',
            status: 'supported', level: 'L0', cost: 0, origin: 'tpl-pack-v4',
            originLabel: 'Resale template pack v4',
            source: SRC.agora, found: '2015-06-04',
          },
          {
            kind: 'Handle', title: 'merrow_supply / merrow.supply — separator swap only',
            detail: 'One character differs and neither handle was ever used to sign anything. A handle is a label, and labels are free.',
            status: 'questionable', level: 'L0', cost: 0, origin: 'tpl-pack-v4',
            originLabel: 'Copied identity bundle',
            source: SRC.grams, found: '2015-06-02',
          },
          {
            kind: 'PGP key block', title: 'Public key pasted on both profiles, never used to sign',
            detail: 'The same key block appears on both profiles. It was never used to sign a message, so it demonstrates a paste and nothing more.',
            status: 'questionable', level: 'L0', cost: 0, origin: 'tpl-pack-v4',
            originLabel: 'Copied identity bundle',
            source: SRC.evolution, found: '2015-06-02',
          },
          {
            kind: 'Wallet address', title: 'Address pasted into both profiles, no control shown',
            detail: 'An address typed into a page is not control of an address. No funds move and no signed declaration binds it.',
            status: 'questionable', level: 'L0', cost: 0, origin: 'tpl-pack-v4',
            originLabel: 'Copied identity bundle',
            source: SRC.grams, found: '2015-06-04',
          },
          {
            kind: 'Escrow policy', title: '“Escrow accepted · FE available · 24h dispatch”',
            detail: 'The most-cited matching phrase in the case. It appears in 412 archived profiles.',
            status: 'questionable', level: 'L0', cost: 0, origin: 'tpl-pack-v4',
            originLabel: 'Resale template pack v4',
            source: SRC.grams, found: '2015-06-04',
          },
          {
            kind: 'Posting cadence', title: 'Both posted within 03:00–06:00 UTC',
            detail: 'Timing overlap, 61% of post-days. Weak on its own, and the archive covers a limited window.',
            status: 'unverified', level: 'L0', cost: 2, origin: 'cadence-a',
            originLabel: 'Independent observation',
            source: SRC.evolution, found: '2015-07-11',
          },
        ],
        bundles: [
          {
            id: 'tpl-pack-v4',
            title: '6 observations · 4 signals · 1 origin — counted once',
            note: '6 observations · 4 signals, 1 origin — counted once. Zero proof weight, because none of it is anything but a paste.',
            items: [
              'Handle — merrow_supply / merrow.supply, same token with the separator swapped',
              'PGP key block — pasted, never used to sign anything',
              'Wallet address — pasted into both profiles, no control demonstrated',
              'Template listing — description, product line and escrow terms from the pack',
            ],
            occurrencesElsewhere: 412,
            cost: 0,
            countsOnce: true,
          },
        ],
        missing: [
          { text: 'A PGP-signed message from merrow_supply that names the new handle', effect: 'HOLD → ASSERT', tier: 1 },
          { text: 'A wallet-control declaration signed by either handle', effect: 'HOLD → ASSERT', tier: 1 },
          { text: 'A unique writing fingerprint that survives the template strikethrough', effect: 'HOLD → HOLD (strengthens SUPPORTED)', tier: 2 },
        ],
      },
      key_control: {
        status: 'UNVERIFIED', takeover: false, peak: 'L0',
        summary: 'A PGP key is published on the Market B profile. No message signed by it has been seen, so nothing is established about who holds it.',
        falsify: 'A signed message from that key naming either handle.',
        evidence: [
          {
            kind: 'Public key', title: 'Key 0x8F2A…C41D published on profile only',
            detail: 'A key block on a profile page is a paste. It proves the page contains a key, and nothing else.',
            status: 'unverified', level: 'L0', cost: 0, origin: 'key-block-paste',
            originLabel: 'Profile page paste',
            source: SRC.evolution, found: '2015-06-02',
          },
        ],
        bundles: [],
        missing: [{ text: 'Any message signed with this key', effect: 'HOLD → ASSERT', tier: 1 }],
      },
    },
    graph: {
      nodes: [
        { id: 'a', label: 'merrow_supply', kind: 'persona', market: 'Market A', x: 0.18, y: 0.5 },
        { id: 'b', label: 'merrow.supply', kind: 'persona', market: 'Market B', x: 0.82, y: 0.5 },
        { id: 't', label: 'template pack v4', kind: 'artifact', x: 0.5, y: 0.5 },
        { id: 'x', label: '412 other profiles', kind: 'artifact', x: 0.5, y: 0.16 },
      ],
      edges: [
        { from: 'a', to: 't', status: 'supported', label: 'description' },
        { from: 'b', to: 't', status: 'supported', label: 'description' },
        { from: 't', to: 'x', status: 'questionable', label: 'shared origin' },
      ],
    },
    ledger: [
      { act: 'Case opened', actor: 'analyst.a', hash: '3f9c1a72', at: '2026-09-24 11:02' },
      { act: 'Ingested Market A vendor page (archived)', actor: 'system', hash: '8b41d0e6', at: '2026-09-24 11:04' },
      { act: 'Ingested Market B vendor page', actor: 'system', hash: 'c27e5590', at: '2026-09-24 11:04' },
      { act: 'Copy-origin folding applied: 4 signals → 1 origin', actor: 'system', hash: 'a10f3d84', at: '2026-09-24 11:05' },
      { act: 'Verdict set: Persona Link = HOLD', actor: 'system', hash: 'ee204c19', at: '2026-09-24 11:05' },
      { act: 'Verdict set: Key Control = HOLD', actor: 'system', at: '2026-09-24 11:05' },
    ],
    typical: { signals: 4, score: 94, label: 'identity confidence', merged: true },
  },

  /* ==================================================================
     SCENE 2 — GENUINE MIGRATION  →  ASSERT
     Persona-bound signature and funds move establish control; writing alone does not.
     ================================================================== */
  {
    id: 'genuine',
    n: 2,
    title: 'Genuine migration',
    question: 'A vendor leaves a market that exit-scammed. Is the new profile the same operator?',
    verdict: 'ASSERT',
    caption: PRESENTER.find(p => p.scene === 'genuine').caption,
    case: { id: 'SA-26151-0002', opened: '2026-09-24 15:40', analyst: 'analyst.a' },
    subjects: [
      { handle: 'pale_horse', market: 'Market A', first: '2015-01-11', last: '2015-03-30' },
      { handle: 'pale_horse.', market: 'Market B', first: '2015-04-14', last: '2015-09-02' },
    ],
    claims: {
      key_control: {
        status: 'VERIFIED', takeover: false, peak: 'L2',
        summary: 'A verified signature from the January key names the new handle in its signed body.',
        falsify: 'A failed signature verification or evidence that the key was transferred.',
        evidence: [{
          kind: 'Signed message', title: 'January key signs the new persona-bound attestation',
          detail: 'The signed body names pale_horse. and is dated when the new profile appears.',
          status: 'verified', level: 'L2', cost: 4, origin: 'sig-2015-04-14',
          originLabel: 'Signed attestation, 2015-04-14', source: SRC.evolution, found: '2015-04-14',
        }],
        bundles: [], missing: [],
      },
      persona_link: {
        status: 'VERIFIED', takeover: false, peak: 'L3',
        summary:
          'A message on the new profile is signed by the key that was published on the old profile in January, and the signed body names the new handle. The wallet behind the old profile moves its full balance to the new profile’s declared address five days before the new profile appears.',
        falsify:
          'A second signature over the same key by a different party, or evidence the balance move was to a third party rather than the declared address.',
        evidence: [
          {
            kind: 'Signed message', title: 'New profile signed by the January key; body names pale_horse.',
            detail: 'The signature verifies, the signed body names the new handle, and the signed timestamp matches the new profile’s first recorded date. This is persona-bound: it cannot be produced by copying a block from anywhere else.',
            status: 'verified', level: 'L2', cost: 4, origin: 'sig-2015-04-14',
            originLabel: 'Signed attestation, 2015-04-14',
            source: SRC.evolution, found: '2015-04-14',
          },
          {
            kind: 'Wallet move', title: 'Full balance of the old cluster moves to the declared address',
            detail: '1.482 BTC leaves the address the old profile published, in one transaction, to the address the new profile declares. A balance move requires the private key.',
            status: 'verified', level: 'L3', cost: 4, origin: 'chain-2015-04-09',
            originLabel: 'On-chain transaction',
            source: SRC.evolution, found: '2015-04-09',
          },
          {
            kind: 'Writing fingerprint', title: 'Characteristic misspelling reused: “no exceptionss”',
            detail: 'A low-frequency error reappears verbatim. Treated as supporting only — spelling is copyable, so it can never carry a claim to ASSERT on its own.',
            status: 'supported', level: 'L1', cost: 3, origin: 'fp-typo',
            originLabel: 'Writing sample',
            source: SRC.darkforums, found: '2015-04-20',
          },
        ],
        bundles: [],
        missing: [],
      },
      wallet_control: {
        status: 'VERIFIED', takeover: false, peak: 'L3',
        summary: 'Control established by a funds move, not by an address appearing in text.',
        falsify: 'Evidence the receiving address belongs to a market escrow rather than the operator.',
        evidence: [
          {
            kind: 'Address declaration', title: 'Address declared in a signed message',
            detail: 'The address is bound to the persona by a signature, then confirmed by the move.',
            status: 'verified', level: 'L2', cost: 4, origin: 'addr-decl-2015-04',
            originLabel: 'Signed declaration',
            source: SRC.evolution, found: '2015-04-14',
          },
          {
            kind: 'Funds move', title: 'Balance moved from old cluster, single transaction',
            detail: 'Requires the private key of the sending address.',
            status: 'verified', level: 'L3', cost: 4, origin: 'chain-2015-04-09',
            originLabel: 'On-chain transaction',
            source: SRC.evolution, found: '2015-04-09',
          },
        ],
        bundles: [],
        missing: [],
      },
    },
    graph: {
      nodes: [
        { id: 'a', label: 'pale_horse', kind: 'persona', market: 'Market A', x: 0.16, y: 0.5 },
        { id: 'b', label: 'pale_horse.', kind: 'persona', market: 'Market B', x: 0.84, y: 0.5 },
        { id: 'k', label: 'key 0x41B7…09EE', kind: 'key', x: 0.5, y: 0.24 },
        { id: 'w', label: 'bc1q…7h2k', kind: 'wallet', x: 0.5, y: 0.76 },
      ],
      edges: [
        { from: 'a', to: 'k', status: 'verified', label: 'published' },
        { from: 'b', to: 'k', status: 'verified', label: 'signed, body names handle' },
        { from: 'a', to: 'w', status: 'verified', label: 'declared' },
        { from: 'b', to: 'w', status: 'verified', label: 'balance received' },
      ],
    },
    ledger: [
      { act: 'Case opened', actor: 'analyst.a', hash: 'b4409ee1', at: '2026-09-24 15:40' },
      { act: 'Signature verified against 2015-01 public key', actor: 'system', hash: '77c1a0f3', at: '2026-09-24 15:42' },
      { act: 'On-chain move confirmed, 1.482 BTC', actor: 'system', hash: '2de9114b', at: '2026-09-24 15:43' },
      { act: 'Verdict set: Persona Link = ASSERT (L3)', actor: 'system', hash: '0a7bb2c8', at: '2026-09-24 15:43' },
      { act: 'Verdict set: Key Control = ASSERT', actor: 'system', at: '2026-09-24 15:43' },
      { act: 'Verdict set: Wallet Control = ASSERT', actor: 'system', at: '2026-09-24 15:43' },
    ],
    typical: { signals: 3, score: 91, label: 'identity confidence', merged: true },
  },

  /* ==================================================================
     SCENE 3 — REPLAYED SIGNATURE  →  QUESTIONABLE / HOLD
     Original block: 2016-01-05; new profile: 2016-02-11, 5 weeks later. Replay carries zero weight.
     ================================================================== */
  {
    id: 'replay',
    n: 3,
    title: 'Replayed signature',
    question: 'The signature verifies. Does that mean the operator signed it?',
    verdict: 'HOLD',
    caption: PRESENTER.find(p => p.scene === 'replay').caption,
    case: { id: 'SA-26151-0003', opened: '2026-09-25 09:18', analyst: 'analyst.b' },
    subjects: [
      { handle: 'halcyon_vault', market: 'Market B', first: '2016-02-11', last: '2016-05-02' },
      { handle: 'halcyon.vault', market: 'Market C', first: '2016-01-05', last: '2016-01-20' },
    ],
    claims: {
      key_control: {
        status: 'QUESTIONABLE', takeover: false, peak: 'L0',
        summary:
          'The block on the new profile is byte-identical to a block published on the old profile in January. The signed body names the old handle and carries an old date. Nothing was signed for the new persona, so control of the new persona is not established.',
        falsify:
          'A block whose signed body names halcyon_vault, or whose signature date falls after the new profile appeared.',
        evidence: [
          {
            kind: 'Signature', title: 'Signature verifies — and carries zero proof weight',
            detail: 'The cryptography is sound: real signature, real key. It is also byte-identical to a block published earlier and its signed body names a different handle, so it was not made for this persona. Flagged as a replay and excluded from proof weight entirely — it is displayed because hiding it would hide the attack, not because it counts.',
            status: 'questionable', level: 'L0', cost: 0,
            flags: ['replayed_signature'],
            note: 'replayed — first seen 2016-01-05 on Market C',
            origin: 'sig-replay', originLabel: 'Replayed block, Jan 2016',
            source: SRC.darkforums, found: '2016-02-11',
          },
          {
            kind: 'Byte comparison', title: 'Block is byte-identical to the post 5 weeks earlier',
            detail: 'Zero byte difference. A fresh attestation would differ — it would name the new handle and carry a current date.',
            status: 'questionable', level: 'L0', cost: 0, origin: 'sig-replay',
            originLabel: 'Replayed block, Jan 2016',
            source: SRC.evolution, found: '2016-02-11',
          },
          {
            kind: 'Timestamp', title: 'Original signed block: 5 weeks earlier',
            detail: 'The signed body was written before the profile it is claimed to attest to existed. It cannot attest to it.',
            status: 'questionable', level: 'L0', cost: 0, origin: 'sig-replay',
            originLabel: 'Replayed block, Jan 2016',
            source: SRC.evolution, found: '2016-02-11',
          },
          {
            kind: 'Signed body', title: 'Signed body names the old handle, not the new one',
            detail: 'The only persona named inside the signature is halcyon.vault. Nothing binds halcyon_vault.',
            status: 'questionable', level: 'L0', cost: 0, origin: 'sig-replay',
            originLabel: 'Replayed block, Jan 2016',
            source: SRC.darkforums, found: '2016-02-11',
          },
        ],
        bundles: [
          {
            id: 'sig-replay',
            title: 'One replayed block',
            note: 'Four observations. One artifact. One origin.',
            items: ['Signature verifies', 'Byte-identical to Jan 2016 post', 'Signed date predates profile', 'Signed body names old handle'],
            occurrencesElsewhere: 1,
          },
        ],
        missing: [
          { text: 'A signature whose signed body names halcyon_vault', effect: 'HOLD → ASSERT', tier: 1 },
          { text: 'A signature dated after 2016-02-11', effect: 'HOLD → ASSERT', tier: 1 },
        ],
      },
    },
    graph: {
      nodes: [
        { id: 'a', label: 'halcyon.vault', kind: 'persona', x: 0.24, y: 0.5 },
        { id: 'b', label: 'halcyon_vault', kind: 'persona', x: 0.76, y: 0.5 },
        { id: 's', label: 'replayed block', kind: 'artifact', x: 0.5, y: 0.5 },
      ],
      edges: [
        { from: 'a', to: 's', status: 'verified', label: 'original, Jan 2016' },
        { from: 'b', to: 's', status: 'questionable', label: 'byte-identical' },
      ],
    },
    ledger: [
      { act: 'Case opened', actor: 'analyst.b', hash: '15d0c7a2', at: '2026-09-25 09:18' },
      { act: 'Signature verified (crypto: pass)', actor: 'system', hash: '9a3f00be', at: '2026-09-25 09:19' },
      { act: 'Replay detected: original 2016-01-05, new profile 2016-02-11 — 5 weeks earlier', actor: 'system', hash: 'fe81c204', at: '2026-09-25 09:19' },
      { act: 'Verdict set: Key Control = HOLD (replay, zero weight)', actor: 'system', hash: '6612ab7d', at: '2026-09-25 09:19' },
    ],
    typical: { signals: 1, score: 88, label: 'signature validity', merged: true },
  },

  /* ==================================================================
     SCENE 4 — PASTED VS SIGNED WALLET  →  ladder jump L0 → L2
     ================================================================== */
  {
    id: 'ladder',
    n: 4,
    title: 'Pasted vs signed wallet',
    question: 'An address appears in a forum post. Does that establish control of it?',
    verdict: 'HOLD',
    caption: PRESENTER.find(p => p.scene === 'ladder').caption,
    case: { id: 'SA-26151-0004', opened: '2026-09-25 13:05', analyst: 'analyst.a' },
    subjects: [
      { handle: 'quillmark', market: 'Market C', first: '2016-03-02', last: '2016-07-19' },
      { handle: 'quillmark_', market: 'Market B', first: '2016-06-21', last: '2016-09-01' },
    ],
    claims: {
      wallet_control: {
        status: 'SUPPORTED', takeover: false, peak: 'L2',
        requiresFreshControl: true,
        summary:
          'The address is named in a signed declaration, which binds it to the persona and needs the private key to reproduce. It stops short of ASSERT because no funds have moved, so control is attested but not demonstrated.',
        falsify: 'Evidence the address is a market escrow that the persona never controlled.',
        evidence: [
          {
            kind: 'Forum post', title: 'Address typed in a plain post: bc1q…q7vd',
            detail: 'A pasted string. Anyone can type any address. This establishes nothing about control.',
            status: 'unverified', level: 'L0', cost: 1, origin: 'paste-1',
            originLabel: 'Unsigned forum post',
            source: SRC.darkforums, found: '2016-03-04',
          },
          {
            kind: 'Signed declaration', title: 'Same address declared inside a signed message',
            detail: 'The signed body names the handle and the address together. Reproducing it needs the private key.',
            status: 'verified', level: 'L2', cost: 4, origin: 'decl-2',
            originLabel: 'Signed attestation, 2016-06-25',
            source: SRC.evolution, found: '2016-06-25',
          },
          {
            kind: 'Copy-origin check', title: 'Post text is template, not operator writing',
            detail: 'The surrounding post reuses a known resale template. The address is the load-bearing part, not the prose.',
            status: 'questionable', level: 'L0', cost: 0, origin: 'tpl-pack-v4',
            originLabel: 'Resale template pack v4',
            source: SRC.grams, found: '2016-03-04',
          },
        ],
        bundles: [
          {
            id: 'tpl-pack-v4', title: 'Resale template pack v4', note: 'The prose is not evidence. Discounted.', countsOnce: true, cost: 0,
            items: ['Listing description block'], occurrencesElsewhere: 412,
          },
        ],
        missing: [
          { text: 'A funds move from the declared address', effect: 'HOLD → ASSERT', tier: 1 },
          { text: 'A second declaration naming the other handle', effect: 'HOLD → HOLD (strengthens SUPPORTED)', tier: 2 },
        ],
      },
    },
    graph: {
      nodes: [
        { id: 'p', label: 'quillmark', kind: 'persona', x: 0.28, y: 0.34 },
        { id: 'w', label: 'bc1q…q7vd', kind: 'wallet', x: 0.68, y: 0.34 },
        { id: 't', label: 'template pack v4', kind: 'artifact', x: 0.28, y: 0.74 },
      ],
      edges: [
        { from: 'p', to: 't', status: 'questionable', label: 'prose' },
        { from: 'p', to: 'w', status: 'verified', label: 'signed declaration' },
      ],
    },
    ladderDemo: {
      before: { verdict: 'HOLD', peak: 'L0', status: 'UNVERIFIED' },
      signed: { verdict: 'HOLD', peak: 'L2', status: 'SUPPORTED' },
      after: { verdict: 'ASSERT', peak: 'L3', status: 'VERIFIED' },
      move: 'L0 → L2 → L3 · pasted address → signed declaration → fresh challenge / funds move',
    },
    ledger: [
      { act: 'Case opened', actor: 'analyst.a', hash: 'cc10bb42', at: '2026-09-25 13:05' },
      { act: 'Address seen in unsigned post (L0)', actor: 'system', hash: '4a7e1190', at: '2026-09-25 13:06' },
      { act: 'Signed declaration added, L0 → L2', actor: 'analyst.a', hash: '0b93cc71', at: '2026-09-25 13:24' },
      { act: 'Verdict set: Wallet Control = HOLD (SUPPORTED)', actor: 'system', hash: '7f2e04aa', at: '2026-09-25 13:24' },
    ],
    typical: { signals: 1, score: 62, label: 'wallet linkage', merged: false },
  },

  /* ==================================================================
     SCENE 5 — TAKEOVER WITH CHANGE-POINT  →  outlined amber HOLD
     ================================================================== */
  {
    id: 'takeover',
    n: 5,
    title: 'Takeover with change-point',
    question: 'The key is the same. Is the person still the same?',
    verdict: 'HOLD',
    caption: PRESENTER.find(p => p.scene === 'takeover').caption,
    case: { id: 'SA-26151-0005', opened: '2026-09-25 17:50', analyst: 'analyst.b' },
    subjects: [{ handle: 'cinderbox', market: 'Market B', first: '2015-06-02', last: '2016-09-14' }],
    takeoverFlag: true,
    claims: {
      key_control: {
        status: 'VERIFIED', takeover: false, peak: 'L3',
        summary: 'The key is genuinely held. Three signed attestations across the period, all verifying.',
        falsify: 'Evidence of key compromise or a second signer.',
        evidence: [
          { kind: 'Signed message', title: 'Attestations on 2015-06-02, 2016-02-28, 2016-08-18', observationDates: ['2015-06-02', '2016-02-28', '2016-08-18'], detail: 'All three verify against the same key.', status: 'verified', level: 'L3', cost: 4, origin: 'key-cinderbox', originLabel: 'Signed attestations', source: SRC.evolution, found: '2016-08-18' },
        ],
        bundles: [], missing: [],
      },
      same_operator: {
        status: 'QUESTIONABLE', takeover: true, peak: 'L1',
        summary:
          'Behaviour changes on 2016-03-14. Operator continuity is not confirmed; key possession is evaluated only under Key Control.',
        falsify:
          'An out-of-band continuity signal: a phrase the two parties had agreed in advance, or a signed message from the original operator confirming or denying a transfer.',
        evidence: [
          { kind: 'Listing behaviour', title: 'Curated, escrow-only → bulk, FE-only', detail: 'Inventory jumps from 6 items to 94. Escrow is dropped entirely after the change-point.', status: 'questionable', level: 'L1', cost: 3, origin: 'behav-before', originLabel: 'Behaviour: before/after comparison', source: SRC.evolution, found: '2016-04-02' },
          { kind: 'Writing voice', title: 'British spelling, long posts → US spelling, terse', detail: 'Discrimination margin against the pre-change sample falls to 0.58, at the bottom of the unrelated-pair band.', status: 'questionable', level: 'L1', cost: 3, origin: 'behav-after', originLabel: 'Behaviour: after change-point', source: SRC.evolution, found: '2016-05-11' },
          { kind: 'Presence', title: 'Pre-change posting pattern stops entirely', detail: 'The 04:00–07:00 UTC window disappears on the same date.', status: 'questionable', level: 'L1', cost: 3, origin: 'behav-after', originLabel: 'Behaviour: after change-point', source: SRC.evolution, found: '2016-03-14' },
          { kind: 'Change-point', title: 'Behavioural change-point — 14 March', detail: 'Listing, writing and presence shift at the same point in the record.', status: 'questionable', level: 'L1', cost: 3, origin: 'behav-after', originLabel: 'Behavioural change-point', source: SRC.fixture, found: '2016-03-14' },
        ],
        bundles: [
          { id: 'behav-after', title: 'Post-change behaviour', note: 'Three markers, one side of the change-point. Counted once.', items: ['Inventory shift', 'Register shift', 'Presence shift'], occurrencesElsewhere: 1 },
        ],
        missing: [
          { text: 'An out-of-band continuity signal agreed before the change', effect: 'HOLD → ASSERT', tier: 1 },
          { text: 'A signed message from the original operator confirming or denying transfer', effect: 'HOLD → ASSERT or REJECT', tier: 1 },
          { text: 'A pre-change signed message using post-change register', effect: 'HOLD → HOLD (weakens takeover flag)', tier: 3 },
        ],
      },
    },
    continuity: {
      from: '2015-06', to: '2016-09',
      changePoint: 0.61, changeLabel: '2016-03-14',
      segments: [
        { label: 'curated · escrow · 04:00–07:00 UTC', w: 0.61, kind: 'solid' },
        { label: 'bulk · FE only · no fixed window', w: 0.39, kind: 'break' },
      ],
      note: 'The break is datable. It is not a gap in the record — it is a change inside a continuous record.',
    },
    graph: {
      nodes: [
        { id: 'p', label: 'cinderbox', kind: 'persona', x: 0.5, y: 0.5 },
        { id: 'k', label: 'key 0xC10B…77A4', kind: 'key', x: 0.5, y: 0.16 },
        { id: 'b1', label: 'before 2016-03-14', kind: 'artifact', x: 0.2, y: 0.82 },
        { id: 'b2', label: 'after 2016-03-14', kind: 'artifact', x: 0.8, y: 0.82 },
      ],
      edges: [
        { from: 'p', to: 'k', status: 'verified', label: 'holds key' },
        { from: 'p', to: 'b1', status: 'verified', label: 'matches' },
        { from: 'p', to: 'b2', status: 'takeover', label: 'does not match' },
      ],
    },
    ledger: [
      { act: 'Case opened', actor: 'analyst.b', hash: 'aa03f17c', at: '2026-09-25 17:50' },
      { act: 'Change-point detected at 2016-03-14', actor: 'system', hash: '3c8bb590', at: '2026-09-25 17:52' },
      { act: 'Takeover flag raised: key valid, behaviour changed, operator not confirmed', actor: 'system', hash: 'dc4a0e21', at: '2026-09-25 17:52' },
      { act: 'Verdict set: Same Operator = HOLD', actor: 'system', hash: '1902fe6b', at: '2026-09-25 17:52' },
      { act: 'Verdict set: Key Control = ASSERT', actor: 'system', at: '2026-09-25 17:52' },
    ],
    typical: { signals: 4, score: 89, label: 'identity confidence', merged: true },
  },

  /* ==================================================================
     SCENE 6 — CERT LEAK vs TEMPLATE FAVICON  →  VERIFIED / ASSERT
     A rare finding keeps its weight; a ubiquitous one cancels to zero.
     ASSERT rests on the certificate + server-status leak; common assets
     are shown and discounted.
     ================================================================== */
  {
    id: 'hosting',
    n: 6,
    title: 'Cert leak vs template favicon',
    question: 'Several infrastructure findings point at the same hidden service. Are they the same kind of evidence?',
    verdict: 'ASSERT',
    caption: PRESENTER.find(p => p.scene === 'hosting').caption,
    case: { id: 'SA-26151-0006', opened: '2026-09-26 08:30', analyst: 'analyst.a' },
    subjects: [{ handle: 'vaultwright', market: 'Market A', first: '2016-01-04', last: '2016-12-19' }],
    category: ['hosting infrastructure', 'misconfiguration exposure'],
    lastScan: '2026-09-26 08:34',
    nextScans: ['2026-09-27 08:30', '2026-09-28 08:30', '2026-09-29 08:30', '2026-09-30 08:30', '2026-10-01 08:30'],
    candidateOrigins: [
      { host: '203.0.113.14', role: 'candidate origin', confidence: 'rare-finding match', findings: 2, authorised: true, source: SRC.fixture, note: 'Observed from an authorised clearnet scan range. Documentation IP.' },
      { host: '203.0.113.61', role: 'same /24, unverified', confidence: 'no rare finding', findings: 0, authorised: true, source: SRC.fixture, note: 'Same subnet, nothing specific observed. Not evidence.' },
      { host: '198.51.100.7', role: 'ruled out', confidence: 'descriptor mismatch', findings: 0, authorised: true, source: SRC.fixture, note: 'Descriptor does not match. Recorded so the elimination is visible.' },
    ],
    claims: {
      hosting_link: {
        status: 'VERIFIED', takeover: false, peak: 'L2',
        summary:
          'A certificate naming the service’s vanity substring was issued to a clearnet host, and the same certificate was observed on a candidate origin. Both findings require control of the certificate request, so both carry real cost to forge. The certificate + server-status leak support Hosting Link · ASSERT; common assets are discounted.',
        falsify:
          'The certificate renewing to a different organisation, the candidate origin resolving to a shared hosting pool, or a second unrelated service presenting the identical certificate.',
        evidence: [
          {
            kind: 'TLS certificate', title: 'Certificate SAN names the clearnet domain',
            detail: 'Subject Alternative Name contains the clearnet domain matching the service’s vanity substring. A SAN entry of this specificity is not produced by accident: it requires control of the certificate request for that domain.',
            status: 'verified', level: 'L2', cost: 4, flags: [], origin: 'cert-SAN',
            originLabel: 'TLS certificate, single host',
            source: SRC.fixture, found: '2016-11-02',
          },
          {
            kind: 'Cert observation', title: 'Same certificate observed on candidate origin 203.0.113.14',
            detail: 'The identical certificate (same serial, same SAN) was served by 203.0.113.14 during an authorised scan. The same certificate on two hosts links those hosts.',
            status: 'verified', level: 'L2', cost: 4, flags: [], origin: 'cert-SAN',
            originLabel: 'TLS certificate, single host',
            source: SRC.fixture, found: '2016-11-02',
          },
          {
            kind: 'Server leak', title: '/server-status exposes an internal vhost name',
            detail: 'The exposed status page names an internal vhost matching the hidden service naming convention. Misconfiguration exposure: real but not rare, and it names an internal name rather than proving common control.',
            status: 'supported', level: 'L1', cost: 3, flags: [], origin: 'server-status',
            originLabel: 'Misconfiguration exposure',
            source: SRC.fixture, found: '2016-11-02',
          },
          {
            kind: 'Descriptor', title: 'Descriptor inconsistency with service headers',
            detail: 'The descriptor metadata and service headers disagree. Inconsistency weakens any single identifier but does not contradict the certificate finding.',
            status: 'questionable', level: 'L1', cost: 2, flags: ['context_only'], origin: 'descriptor-mismatch',
            originLabel: 'Descriptor metadata',
            source: SRC.onionoo, found: '2016-11-03',
          },
          {
            kind: 'Banner', title: 'Default nginx banner',
            detail: 'The default banner string. Ubiquitous: it appears on a large fraction of services and carries no information about this one.',
            status: 'questionable', level: 'L0', cost: 0, flags: ['common_indicator'],
            discount: 'discounted: common on 2.3M hosts',
            origin: 'nginx-default', originLabel: 'Default web-server asset',
            source: SRC.fixture, found: '2016-11-02',
          },
          {
            kind: 'Favicon hash', title: 'Default nginx favicon — discounted — common asset',
            detail: 'Default web-server asset on 2.3M hosts. It carries no information about this service. Cancelled rather than counted.',
            status: 'questionable', level: 'L0', cost: 0, flags: ['common_indicator'],
            discount: 'discounted — common asset on 2.3M hosts',
            origin: 'favicon-default', originLabel: 'Default web-server asset',
            source: SRC.fixture, found: '2016-11-02',
          },
        ],
        bundles: [
          {
            id: 'common-assets',
            title: 'Default web-server assets — discounted to zero',
            note: 'Two signals, one origin, no specificity. This is the most common false-positive source in the archive. Counted as zero, at cost 0.',
            items: ['Default nginx banner', 'Default nginx favicon hash'],
            occurrencesElsewhere: 2300000,
            occurrenceLabel: '2.3M hosts',
            cost: 0,
            countsOnce: true,
          },
        ],
        missing: [],
      },
    },
    graph: {
      nodes: [
        { id: 'h', label: 'vaultwright', kind: 'persona', x: 0.5, y: 0.14 },
        { id: 'c', label: 'cert SAN, 1 host', kind: 'artifact', x: 0.2, y: 0.5 },
        { id: 'o', label: '203.0.113.14', kind: 'artifact', x: 0.5, y: 0.5 },
        { id: 'l', label: '/server-status leak', kind: 'artifact', x: 0.8, y: 0.5 },
        { id: 'f', label: 'default banner + favicon', kind: 'artifact', x: 0.5, y: 0.88 },
      ],
      edges: [
        { from: 'h', to: 'c', status: 'verified', label: 'SAN names domain' },
        { from: 'c', to: 'o', status: 'verified', label: 'same cert served' },
        { from: 'o', to: 'l', status: 'supported', label: 'misconfiguration' },
        { from: 'o', to: 'f', status: 'questionable', label: 'no specificity' },
      ],
    },
    ledger: [
      { act: 'Case opened', actor: 'analyst.a', hash: '59bd2201', at: '2026-09-26 08:30' },
      { act: 'Certificate SAN extracted; clearnet domain matched', actor: 'system', hash: '81fa4d0c', at: '2026-09-26 08:32' },
      { act: 'Same certificate observed on candidate origin 203.0.113.14', actor: 'system', hash: 'd0c7a3f1', at: '2026-09-26 08:33' },
      { act: 'Default banner and favicon discounted: common-indicator, 2.3M hosts', actor: 'system', hash: '4c07eb95', at: '2026-09-26 08:33' },
      { act: 'Candidate origins recorded: 1 match, 1 unverified, 1 ruled out', actor: 'system', hash: '7b2e0a66', at: '2026-09-26 08:34' },
      { act: 'Verdict set: Hosting Link = ASSERT (peak L2)', actor: 'system', hash: 'b6e1307f', at: '2026-09-26 08:34' },
    ],
    typical: { signals: 6, score: 91, label: 'hosting confidence', merged: true },
  },

  /* ==================================================================
     SCENE 7 — SOCK-PUPPET VOUCH RING  →  REJECT
     Four independent vouches. One actor.
     ================================================================== */
  {
    id: 'ring',
    n: 7,
    title: 'Sock-puppet vouch ring',
    question: 'Four accounts vouch for a vendor. Is that four corroborations?',
    verdict: 'HOLD',
    caption: PRESENTER.find(p => p.scene === 'ring').caption,
    case: { id: 'SA-26151-0007', opened: '2026-09-26 12:15', analyst: 'analyst.b' },
    subjects: [{ handle: 'sable_ledger', market: 'Market C', first: '2016-04-08', last: '2016-11-30' }],
    claims: {
      persona_link: {
        status: 'CONTRADICTED', takeover: false, peak: 'L0',
        trustWeight: 0,
        summary:
          'The vouching accounts are not independent of the vouchee. They were created together, they exist only to vouch, and one shares a key ID with the vouchee. Corroboration from non-independent sources is not corroboration.',
        falsify: 'A vouch from an account with an independent posting history predating the vendor.',
        evidence: [
          { kind: 'Vouch', title: '3 voucher accounts vouch in a 6-day window', detail: 'Reads as independent corroboration until account metadata is examined.', status: 'questionable', level: 'L0', cost: 1, origin: 'ring-1', originLabel: 'Vouch ring', source: SRC.darkforums, found: '2016-05-02' },
          { kind: 'Account metadata', title: 'All 3 voucher accounts created within 40 minutes', detail: 'Creation timestamps cluster. Accounts that appear together rarely act independently.', status: 'contradicted', level: 'L1', cost: 1, origin: 'ring-1', originLabel: 'Vouch ring', source: SRC.darkforums, found: '2016-04-08' },
          { kind: 'Key ID', title: 'One voucher shares the vouchee’s key ID', detail: 'Same key ID. That account cannot be an independent witness to the vouchee.', status: 'contradicted', level: 'L2', cost: 1, origin: 'ring-1', originLabel: 'Vouch ring', source: SRC.darkforums, found: '2016-05-02' },
          { kind: 'Post history', title: 'All 3 voucher accounts posted only vouches', detail: 'No market activity, no questions, no dispute. Accounts that exist only to vouch exist to vouch.', status: 'contradicted', level: 'L0', cost: 1, origin: 'ring-1', originLabel: 'Vouch ring', source: SRC.darkforums, found: '2016-05-14' },
        ],
        bundles: [
          { id: 'ring-1', title: 'Vouch ring', note: 'Three vouchers and one vendor. One coordination; trust weight 0.', items: ['3 vouches', 'Clustered creation times', 'Shared key ID', 'No independent history'], occurrencesElsewhere: 1 },
        ],
        missing: [{ text: 'A vouch from an account with post history older than the vendor', effect: 'REJECT → SUPPORTED', tier: 1 }],
      },
      key_control: {
        status: 'CONTRADICTED', takeover: false, peak: 'L0',
        summary: 'The key ID is shared between two supposed independent parties, which contradicts the claim that they are separate.',
        falsify: 'Evidence the shared key ID is a widely used public key rather than the vendor’s own.',
        evidence: [
          { kind: 'Key ID', title: 'Shared key ID between vouchee and voucher', detail: 'Two accounts claiming independence, one key.', status: 'contradicted', level: 'L1', cost: 3, origin: 'ring-1', originLabel: 'Vouch ring', source: SRC.darkforums, found: '2016-05-02' },
        ],
        bundles: [], missing: [],
      },
    },
    graph: {
      nodes: [
        { id: 'v', label: 'sable_ledger', kind: 'persona', x: 0.5, y: 0.5 },
        { id: 'p1', label: 'vouch_a', kind: 'persona', x: 0.16, y: 0.22 },
        { id: 'p2', label: 'vouch_b', kind: 'persona', x: 0.84, y: 0.22 },
        { id: 'p3', label: 'vouch_c', kind: 'persona', x: 0.16, y: 0.8 },
        { id: 'k', label: 'shared key ID', kind: 'key', x: 0.84, y: 0.8 },
      ],
      edges: [
        { from: 'p1', to: 'v', status: 'questionable', label: 'vouches' },
        { from: 'p2', to: 'v', status: 'questionable', label: 'vouches' },
        { from: 'p3', to: 'v', status: 'questionable', label: 'vouches' },
        { from: 'p3', to: 'k', status: 'contradicted', label: 'holds same key' },
        { from: 'v', to: 'k', status: 'contradicted', label: 'holds same key' },
      ],
    },
    ledger: [
      { act: 'Case opened', actor: 'analyst.b', hash: '70e5c8d1', at: '2026-09-26 12:15' },
      { act: 'Vouch ring folded: 3 vouchers + vendor → trust weight 0', actor: 'system', hash: 'b1f4a832', at: '2026-09-26 12:17' },
      { act: 'Shared key ID detected', actor: 'system', hash: '5ea90c47', at: '2026-09-26 12:17' },
      { act: 'Verdict set: Persona Link = REJECT', actor: 'system', hash: 'd28f3b60', at: '2026-09-26 12:17' },
      { act: 'Verdict set: Key Control = REJECT', actor: 'system', at: '2026-09-26 12:17' },
    ],
    typical: { signals: 3, score: 86, label: 'corroboration strength', merged: true },
  },

  /* ==================================================================
     SCENE 8 — HOLD RESOLVING TO ASSERT
     The payoff. Add the missing evidence, watch the verdict move.
     ================================================================== */
  {
    id: 'resolve',
    n: 8,
    title: 'HOLD resolving to ASSERT',
    question: 'The case is stuck. What is missing, and what would fix it?',
    verdict: 'HOLD',
    caption: PRESENTER.find(p => p.scene === 'resolve').caption,
    case: { id: 'SA-26151-0008', opened: '2026-09-26 16:02', analyst: 'analyst.a' },
    subjects: [
      { handle: 'tessellate', market: 'Market B', first: '2016-02-19', last: '2016-06-08' },
      { handle: 'tessellate_', market: 'Market C', first: '2016-06-30', last: '2016-10-04' },
    ],
    claims: {
      persona_link: {
        status: 'SUPPORTED', takeover: false, peak: 'L1',
        summary:
          'Everything points one way and none of it reaches the ladder. Two handles, consistent register, consistent product line, overlapping counterparties — and no attestation that binds either handle to a key.',
        falsify: 'A signed message naming either handle.',
        evidence: [
          { kind: 'Writing voice', title: 'Register consistent across both handles', detail: 'Discrimination margin 0.79, inside the same-operator band. Writing is copyable, so this caps at supported.', status: 'supported', level: 'L1', cost: 3, origin: 'voice-1', originLabel: 'Writing samples', source: SRC.darkforums, found: '2016-07-12' },
          { kind: 'Counterparties', title: 'Three counterparties appear in both handles’ threads', detail: 'Real overlap, independently observed. No shared key or wallet behind it yet.', status: 'supported', level: 'L1', cost: 2, origin: 'counter-1', originLabel: 'Thread participants', source: SRC.evolution, found: '2016-08-01' },
          { kind: 'Product line', title: 'Narrow catalogue overlap, 5 items', detail: 'Low-frequency items, not a resale template. Modest support.', status: 'supported', level: 'L1', cost: 2, origin: 'catalog-1', originLabel: 'Listing catalogue', source: SRC.evolution, found: '2016-07-02' },
        ],
        bundles: [],
        missing: [
          { text: 'A PGP-signed message naming tessellate_', effect: 'HOLD → ASSERT (Persona Link + Key Control)', tier: 1, collectible: true },
          { text: 'A wallet-control declaration from either handle', effect: 'HOLD → ASSERT', tier: 1, collectible: true },
          { text: 'A counterparty who can attest to both handles off-platform', effect: 'HOLD → HOLD (strengthens SUPPORTED)', tier: 2, collectible: false },
          { text: 'A posting-cadence overlap measured across a full market year', effect: 'HOLD → HOLD (strengthens SUPPORTED)', tier: 3, collectible: false },
        ],
      },
      key_control: {
        status: 'UNVERIFIED', takeover: false, peak: 'L0',
        summary: 'A key block is published; no persona-bound signature has been collected yet.',
        falsify: 'A valid signed attestation naming tessellate_.',
        evidence: [{ kind: 'Key block', title: 'Published key 0x2C7E…91F0',
          detail: 'Published key only; possession has not been demonstrated.',
          status: 'unverified', level: 'L0', cost: 0, origin: 'resolve-key-paste',
          originLabel: 'Published key block', source: SRC.fixture, found: '2016-07-02' }],
        bundles: [],
        missing: [{ text: 'A PGP-signed message naming tessellate_', effect: 'HOLD → ASSERT (Persona Link + Key Control)', tier: 1, collectible: true }],
      },
    },
    graph: {
      nodes: [
        { id: 'a', label: 'tessellate', kind: 'persona', x: 0.18, y: 0.5 },
        { id: 'b', label: 'tessellate_', kind: 'persona', x: 0.82, y: 0.5 },
        { id: 'v', label: 'writing voice', kind: 'artifact', x: 0.5, y: 0.18 },
        { id: 'c', label: '3 counterparties', kind: 'artifact', x: 0.5, y: 0.82 },
      ],
      edges: [
        { from: 'a', to: 'v', status: 'supported', label: 'register' },
        { from: 'b', to: 'v', status: 'supported', label: 'register' },
        { from: 'a', to: 'c', status: 'supported', label: 'shared threads' },
        { from: 'b', to: 'c', status: 'supported', label: 'shared threads' },
      ],
    },
    resolveDemo: {
      missingIndex: 0,
      collected: {
        kind: 'Signed message', title: 'Signed attestation found in Market C archive',
        detail: 'A message signed by key 0x2C7E…91F0 whose signed body names tessellate_. Persona-bound: reproducing it needs the private key.',
        status: 'verified', level: 'L2', cost: 4, origin: 'sig-2016-07-19',
        originLabel: 'Signed attestation, 2016-07-19', source: SRC.darkforums, found: '2016-07-19',
      },
      before: { verdict: 'HOLD', peak: 'L1', status: 'SUPPORTED' },
      after: { verdict: 'ASSERT', peak: 'L2', status: 'VERIFIED' },
    },
    ledger: [
      { act: 'Case opened', actor: 'analyst.a', hash: '91c0bb73', at: '2026-09-26 16:02' },
      { act: 'Missing evidence ranked: 1 item would change verdict', actor: 'system', hash: '2a1fe904', at: '2026-09-26 16:05' },
      { act: 'Verdict set: Persona Link = HOLD', actor: 'system', hash: '6d30c8aa', at: '2026-09-26 16:05' },
      { act: 'Verdict set: Key Control = HOLD', actor: 'system', at: '2026-09-26 16:05' },
    ],
    ledgerAfter: [
      { act: 'Collection job started: signed message', actor: 'analyst.a', hash: 'bf72d011', at: '2026-09-26 16:34' },
      { act: 'Signed attestation verified (L1 → L2)', actor: 'system', hash: 'e4901cc6', at: '2026-09-26 16:35' },
      { act: 'Verdict changed: HOLD → ASSERT', actor: 'system', hash: '17ba0e52', at: '2026-09-26 16:35' },
    ],
    typical: { signals: 3, score: 71, label: 'identity confidence', merged: false },
  },
];

/* =====================================================================
   RED-TEAM ATTACKS
   Each attack is run against the same evidence. Our side recomputes the
   verdict through the locked rules; the comparison side recomputes its
   weighted sum. Never names another team or product.
   ===================================================================== */
const ATTACKS = [
  {
    id: 'copy-key',
    n: 'A1',
    name: 'Copy a published public key',
    desc: 'Paste a genuinely published PGP key block onto a new profile.',
    cost: 1,
    costNote: '5 minutes. No secret needed.',
    target: 'key_control',
    ours: { status: 'UNVERIFIED', peak: 'L0', verdict: 'HOLD', because: 'A key block on a page is a paste. L0 cannot carry a claim.' },
    theirs: { score: 79, because: 'One more matching key = one more weight added.' },
  },
  {
    id: 'copy-boilerplate',
    n: 'A2',
    name: 'Copy the vendor description',
    desc: 'Reproduce the target’s listing text and escrow terms verbatim.',
    cost: 1,
    costNote: '5 minutes. The text is public.',
    target: 'persona_link',
    ours: { status: 'QUESTIONABLE', peak: 'L0', verdict: 'HOLD', because: 'Folds into the template origin. N signals, one origin, counted once.' },
    theirs: { score: 91, because: 'Text similarity is the highest-weighted feature.' },
  },
  {
    id: 'imitate-voice',
    n: 'A3',
    name: 'Imitate the operator’s writing',
    desc: 'Write new posts in the target’s register, cadence and vocabulary.',
    cost: 3,
    costNote: 'Two days of writing. No secret needed.',
    target: 'persona_link',
    ours: { status: 'SUPPORTED', peak: 'L1', verdict: 'HOLD', because: 'Writing is copyable, so it is capped at SUPPORTED by rule. Style can never reach ASSERT.' },
    theirs: { score: 94, because: 'A new stylometry sample that matches raises the behavioural total.' },
  },
  {
    id: 'replay-signature',
    n: 'A4',
    name: 'Replay a real signed message',
    desc: 'Repost a genuine signature block byte-for-byte, unmodified.',
    cost: 2,
    costNote: 'One hour. The block is public.',
    target: 'key_control',
    ours: { status: 'QUESTIONABLE', peak: 'L0', verdict: 'HOLD', because: 'Replayed signature: no fresh proof, cost 0.' },
    theirs: { score: 88, because: 'The signature verifies, so the check passes.' },
  },
];

/* The locked verification rules, stated as rules. The UI renders these. */
const RULES = [
  { id: 'R1', text: 'CONTRADICTED evidence in a claim → REJECT. Contradiction is never averaged away.' },
  { id: 'R2', text: 'Takeover flag → HOLD. A valid key with changed behaviour can never reach ASSERT.' },
  { id: 'R3', text: 'Multiple signals sharing one origin count once. Copy-origin folding runs before any verdict.' },
  { id: 'R4', text: 'ASSERT requires ≥1 persona-bound or fresher bundle (L2+) with no questionable or contradicted evidence in the claim.' },
  { id: 'R5', text: 'Stylometry, boilerplate, cadence and timestamps are capped at SUPPORTED. Copyable evidence cannot assert.' },
  { id: 'R6', text: 'A claim with no evidence is UNVERIFIED and contributes HOLD. Absence is not assent.' },
  { id: 'R7', text: 'Real-world identity requires analyst confirmation and second-analyst approval before export.' },
  { id: 'R8', text: 'Evidence flagged replayed_signature carries zero proof weight. It verifies but was not made for this persona, so it is excluded from evaluation and from the peak proof level.' },
  { id: 'R9', text: 'Verification performs real cryptographic checks. A hard-coded VERIFIED is a defect, not a shortcut.' },
  { id: 'R10', text: 'Common-indicator evidence is discounted, never counted. Cost 0 evidence can never raise a claim.' },
];

const PROOF_LEVELS = [
  { code: 'L0', desc: 'pasted' },
  { code: 'L1', desc: 'signed, unbound' },
  { code: 'L2', desc: 'persona-bound' },
  { code: 'L3', desc: 'fresh (recent block hash / challenge)' },
];

const ruleTitles = ['Contradiction rejects', 'Takeover holds', 'One origin, counted once',
  'Persona-bound proof required', 'Copyable evidence capped', 'No evidence holds',
  'Two-analyst release', 'Replay carries zero proof', 'Cryptographic verification', 'Common assets discounted'];
RULES.forEach((rule, index) => { rule.title = ruleTitles[index]; });

// These scenarios are planted demonstration records, never imported datasets.
for (const scene of SCENES) {
  scene.source_level = 'FIXTURE';
  for (const claim of Object.values(scene.claims)) {
    for (const evidence of claim.evidence || []) evidence.source_level = 'FIXTURE';
  }
  if (scene.resolveDemo) scene.resolveDemo.collected.source_level = 'FIXTURE';
}

attachHistoricalText(SCENES, SRC.fixture);

Object.assign(window, { SCENES, CLAIM_TYPES, COST, SRC, ATTACKS, RULES, PROOF_LEVELS });


export { CLAIM_TYPES, COST, SRC, SCENES, ATTACKS, RULES, PROOF_LEVELS };

