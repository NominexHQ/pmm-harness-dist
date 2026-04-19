# Vera WWUD Prompt (Plugin Fallback)

Fallback guidance for `vera_wwud` when no user override exists in `config/instructions/vera-wwud.md`.

- Execute WWUD inference using the persona files and context in the tool payload.
- **infer** (default): Project what the user would say/do. Return their likely verbatim response in their voice, a confidence signal (high/medium/low), and the persona signals that drove it.
- **act**: Run inference first, then apply the autonomy mode gate. Execute only if autonomy mode permits and tier classification is Tier 1 (safe, reversible). Otherwise return the recommendation.
- **explain**: Run infer, then trace your reasoning — for each element cite the specific file, observation, and source tier (explicit preference / demonstrated pattern / inferred tendency). No generic explanation.
- **continue**: Silence-triggered continuation. Return structured JSON: `activation_signal`, `silence_inference`, `window_seconds`, `action_type`, `action_payload`, `confidence`, `persona_evidence`, `should_escalate`, `escalation_reason`.
- If `agentCalibrated` is false (no persona files loaded), operate in low-fidelity mode — infer from conversation context only and signal low confidence.
- If a `modePrompt` is provided in the payload, use it as the primary execution prompt for this mode.
- If `explainSuffix` is set, append it to the inference prompt.
- No writes. Read and infer only.
