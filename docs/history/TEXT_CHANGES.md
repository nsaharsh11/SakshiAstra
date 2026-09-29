> Historical log. README.md is the authoritative description of the current build.

# Text reduction — complete display-string change list

Fixtures, scene order, evidence values, verdict/status vocabulary and evaluation logic are unchanged. Template rows apply to every matching instance. Removed repetitions are listed separately from relocated content.

| Old | New / location |
|---|---|
| Claim board · <case ID> | <case title> · <case ID> |
| <sidebar case title / ID / opened timestamp / result> | Removed duplicate sidebar case card; case identity remains in board header. |
| 5 claims · 2 opened · 5 on HOLD (3 not yet opened) | 5 claims · 2 checked · 3 waiting |
| opened / assert / hold · opened claims / reject (four counter boxes) | 0 ASSERT · 5 HOLD · 0 REJECT (one chip row) |
| Weakest route | Cost to fake |
| Claims · 5 in the vocabulary, 2 opened | Claims |
| A claim that is not opened contributes HOLD to the verdict, but is not counted in the tallies above. An unexamined question is not a settled one. | Removed; checked/waiting counters express this distinction. |
| Real-world identity is never resolved by the system. An analyst confirms it, and a second analyst approves any export. | Analyst confirms identity. Second analyst approves export. |
| Rules are signed and locked. They are not user-configurable, which is why there is no threshold slider in this product. | All rules (collapsed); cited short rule titles remain visible. |
| Jump to / Relationship graph / Red-team this case / Dossier & custody (right rail) | Removed duplicate navigation; sidebar destinations retained. |
| <claim name> + <question> on each card | <question>; names remain in claim tabs and expanded inspector navigation. |
| Status (repeated label) | Removed label; original status chip retained once. |
| the rule that decided this | <rule ID> · <short reason> |
| <N> items / <N> folded bundles / <N> could change verdict | Supporting evidence is under Show evidence. |
| Open claim (visible card action) | Open claim (inside Show evidence) |
| What this claim asks | Removed duplicate question/summary section; summaries retained in Presenter notes. |
| Proof ladder / peak <L0–L3> / repeated L0–L3 description list | One proof ladder; original L0–L3 labels retained once. |
| Capped at HOLD by the takeover rule, whatever the evidence below does. | Removed ladder note; one rule line remains. |
| Reached <level>: persona-bound or re-verifiable. | Removed ladder note; ladder shows the level. |
| Ceiling here is L1 — signed but unbound. L1 cannot carry ASSERT. | Removed ladder note; one rule line and ladder remain. |
| Only L0 material: pasted strings. L0 cannot carry a claim. | Removed ladder note; one rule line and ladder remain. |
| Not opened on this case | Disabled claim tabs; waiting count on board. |
| A claim that is not opened contributes HOLD. An unexamined question is not a settled one. | Removed duplicate inspector explanation. |
| <kind> · <level> · <origin> / source / date / note (evidence row) | <title> · Cost <cost>/5 · <status>; other fields on expand. |
| Cost to forge (row label) | Cost <cost>/5 |
| Strength / Status / cost repeated inside expanded row | Removed repetitions; original cost/status chips remain in row. |
| Discrimination margin | style similarity (not proof) (inside expanded evidence only) |
| REPLAYED · ZERO WEIGHT / DISCOUNTED (row tags) | Discount and replay explanations retained inside expanded evidence. |
| What would falsify this / Missing evidence / Continuity / Copy-origin bundles / Suspect-entity ladder (always visible) | Same content inside Show evidence. |
| folded before any verdict / ranked by effect / capped by <rule> / system computes 1–3 · rung 4 is human-only | Removed repeated section annotations. |
| Would change HOLD → ASSERT (duplicate missing-item list) | Missing evidence (single actionable list inside Show evidence) |
| Stated with every claim. A claim that cannot say what would break it is not evidence. | Removed repeated explanatory footer. |
| Nothing is missing. Every claim on this case clears its threshold. | No missing evidence for this claim. |
| GAP — no evidence (badge label) | HOLD · UNVERIFIED; reason: GAP — no evidence. |
| No collapsed evidence control on waiting cards | Show evidence → No records collected. |
| 24 Sep 2026 · 11:02 AM IST / 2026-09-24 11:02 | 24 Sep 2026 · 11:02 |
| YYYY-MM-DD (displayed evidence/subject dates) | D Mon YYYY (stored dates unchanged) |
| Long case names displayed with ellipsis | Full names wrap in sidebar and claim tabs. |
| No presenter notes control | Presenter notes (collapsed; original scene and claim explanations retained) |
| Lookalike vendor / Persona Link: 1 item present, none of them verified or supported. A pasted string carries no weight until something binds it. Absence is not assent. | R6 · No independent proof binds this persona. |
| Lookalike vendor / Persona Link: The two handles share a description template, a product line and a posting cadence. Sharing a template is not sharing an operator: the template is a resale pack that was widely copied, so the match collapses to a single origin. | Moved unchanged to Presenter notes. |
| Lookalike vendor / Key Control: 1 item present, none of them verified or supported. A pasted string carries no weight until something binds it. Absence is not assent. | R6 · No independent proof binds this persona. |
| Lookalike vendor / Key Control: A PGP key is published on the Market B profile. No message signed by it has been seen, so nothing is established about who holds it. | Moved unchanged to Presenter notes. |
| Genuine migration: Three signals here, three in scene 1 — same count. The difference is the ladder: this one has a persona-bound signature and a live balance move, so it can reach ASSERT. Signal count is not proof level. | Persona-bound signature confirms key control. |
| Genuine migration / Key Control: 1 persona-bound or fresher bundle, and nothing questionable. This is what ASSERT requires. | R4 · Persona-bound proof verified; no questionable evidence. |
| Genuine migration / Key Control: A verified signature from the January key names the new handle in its signed body. | Moved unchanged to Presenter notes. |
| Genuine migration / Persona Link: 2 persona-bound or fresher bundles, and nothing questionable. This is what ASSERT requires. | R4 · Persona-bound proof verified; no questionable evidence. |
| Genuine migration / Persona Link: A message on the new profile is signed by the key that was published on the old profile in January, and the signed body names the new handle. The wallet behind the old profile moves its full balance to the new profile’s declared address five days before the new profile appears. | Moved unchanged to Presenter notes. |
| Genuine migration / Wallet Control: 2 persona-bound or fresher bundles, and nothing questionable. This is what ASSERT requires. | R4 · Persona-bound proof verified; no questionable evidence. |
| Genuine migration / Wallet Control: Control established by a funds move, not by an address appearing in text. | Moved unchanged to Presenter notes. |
| Replayed signature: The signature verifies — it is a real signature. But it is byte-identical to a block published eleven months earlier, and its signed body names the old handle. A verification check alone passes this. Freshness does not. | Replayed signature carries zero proof. |
| Replayed signature / Key Control: The only material here is a replayed signature. A replay is real cryptography applied to the wrong question, so it cannot carry the claim. Replayed signatures and their artifact observations are excluded from proof weight: a replay verifies but was not made for this persona. | R8 · Replay carries zero proof. |
| Replayed signature / Key Control: The block on the new profile is byte-identical to a block published on the old profile in January. The signed body names the old handle and carries an old date. Nothing was signed for the new persona, so control of the new persona is not established. | Moved unchanged to Presenter notes. |
| Pasted vs signed wallet: Step the ladder. The address is pasted first — five minutes of work for an attacker, no secret needed. Then a signed message declares it, and the cost to forge jumps to “requires the private key”. Watch the verdict move. | Fresh wallet control resolves HOLD. |
| Pasted vs signed wallet / Wallet Control: Wallet control is attested but not demonstrated. A fresh funds move is required before ASSERT. | R4 · Fresh funds move required for ASSERT. |
| Pasted vs signed wallet / Wallet Control: The address is named in a signed declaration, which binds it to the persona and needs the private key to reproduce. It stops short of ASSERT because no funds have moved, so control is attested but not demonstrated. | Moved unchanged to Presenter notes. |
| Takeover with change-point: Key unchanged: key control holds. Behaviour changed: operator not confirmed. | Key control holds; operator remains unconfirmed. |
| Takeover with change-point / Key Control: 1 persona-bound or fresher bundle, and nothing questionable. This is what ASSERT requires. | R4 · Persona-bound proof verified; no questionable evidence. |
| Takeover with change-point / Key Control: The key is genuinely held. Three signed attestations across the period, all verifying. | Moved unchanged to Presenter notes. |
| Takeover with change-point / Same Operator: A takeover flag caps this claim at HOLD: the key is valid, continuity of the operator is not established. | R2 · Changed behaviour keeps Same Operator on HOLD. |
| Takeover with change-point / Same Operator: Behaviour changes on 2016-03-14. Operator continuity is not confirmed; key possession is evaluated only under Key Control. | Moved unchanged to Presenter notes. |
| Discrimination margin against the pre-change sample falls to 0.58, at the bottom of the unrelated-pair band. | style similarity (not proof) against the pre-change sample falls to 0.58, at the bottom of the unrelated-pair band. |
| Cert leak vs template favicon: The certificate supports Hosting Link · ASSERT. The favicon is discounted — common asset on 2.3M hosts. | Certificate links hosting; common assets discounted. |
| Cert leak vs template favicon / Hosting Link: 2 persona-bound or fresher bundles, and nothing questionable. This is what ASSERT requires. | R4 · Persona-bound proof verified; no questionable evidence. |
| Cert leak vs template favicon / Hosting Link: A certificate naming the service’s vanity substring was issued to a clearnet host, and the same certificate was observed on a candidate origin. Both findings require control of the certificate request, so both carry real cost to forge. Two findings on the same host, one of them rare, is what carries this claim to ASSERT. | Moved unchanged to Presenter notes. |
| Sock-puppet vouch ring: 5 graph nodes: vendor, three vouchers, shared key. Vouches discounted · trust weight 0. | 5 graph nodes; shared origin counts once. |
| Sock-puppet vouch ring / Persona Link: 3 pieces of evidence contradict this claim. Contradiction is not averaged against supporting weight. | R1 · Contradiction requires REJECT. |
| Sock-puppet vouch ring / Persona Link: The vouching accounts are not independent of the vouchee. They were created together, they exist only to vouch, and one shares a key ID with the vouchee. Corroboration from non-independent sources is not corroboration. | Moved unchanged to Presenter notes. |
| Sock-puppet vouch ring / Key Control: 1 piece of evidence contradicts this claim. Contradiction is not averaged against supporting weight. | R1 · Contradiction requires REJECT. |
| Sock-puppet vouch ring / Key Control: The key ID is shared between two supposed independent parties, which contradicts the claim that they are separate. | Moved unchanged to Presenter notes. |
| HOLD resolving to ASSERT: A case that cannot move is a failure only if nobody can say why. The missing-evidence panel names the single item that would change the verdict, ranked, with the collection action attached. | Collect persona-bound proof to resolve HOLD. |
| HOLD resolving to ASSERT / Persona Link: Every item here is copyable — text, style or timing. Copyable evidence is capped at SUPPORTED by rule and cannot reach ASSERT. | R5 · Style alone can't prove. Max SUPPORTED. |
| HOLD resolving to ASSERT / Persona Link: Everything points one way and none of it reaches the ladder. Two handles, consistent register, consistent product line, overlapping counterparties — and no attestation that binds either handle to a key. | Moved unchanged to Presenter notes. |
| Discrimination margin 0.79, inside the same-operator band. Writing is copyable, so this caps at supported. | style similarity (not proof) 0.79, inside the same-operator band. Writing is copyable, so this caps at supported. |
| HOLD resolving to ASSERT / Key Control: 1 item present, none of them verified or supported. A pasted string carries no weight until something binds it. Absence is not assent. | R6 · No independent proof binds this persona. |
| HOLD resolving to ASSERT / Key Control: A key block is published; no persona-bound signature has been collected yet. | Moved unchanged to Presenter notes. |
