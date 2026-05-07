# PMM Configuration

Profile: power
Intent: advanced setup with deeper context and maximum control.

Settings that control how Poor Man's Memory behaves.
Run `pmm:settings` at any time to change these.

## Save Cadence

- Mode: every-milestone

## Commit Behaviour

- Mode: auto-commit

## Push Behaviour

- Mode: manual

## Sliding Window Size

<!-- Session-start load window only. PMM does not truncate memory files on disk. -->
- Timeline max: 50
- Summaries max: 20
<!-- Presets: light (20/5) | moderate (30/10) | heavy (50/20) | unlimited -->

## Verbosity

- Mode: verbose

## Maintain Agent Model

- Model: sonnet

## Repository Visibility

- Visibility: private

## Readonly Agent Model

- Readonly model: sonnet

## Session Start

- Mode: eager

## Maintain Strategy

- Strategy: tiered

## Recall Beyond Window

- Mode: auto

## Context Tiers

- Mode: tiered

### Tier 1 (always loaded)
- config.md: tier-1
- standinginstructions.md: tier-1
- progress.md: tier-1
- last.md: tier-1
- preferences.md: tier-1
- decisions.md: tier-1
- lessons.md: tier-1
- processes.md: tier-1
- voices.md: tier-1
- memory.md: tier-1
- summaries.md: tier-1
- timeline.md: tier-1
- threads-open.md: tier-1

### Tier 2 (on demand)
- graph.md: tier-2
- vectors.md: tier-2
- taxonomies.md: tier-2
- assets.md: tier-2
- threads-closed.md: tier-2

## Memory Priority

- Mode: pmm-first

## Pre-Compact Hook

- pre_compact: on

## Active Files

- memory.md: active | full
- assets.md: active
- decisions.md: active | head:10
- processes.md: active | full
- preferences.md: active | full
- voices.md: active | full
- lessons.md: active | tail:10
- timeline.md: active | tail:20
- summaries.md: active | full
- progress.md: active | tail:20
- last.md: active | full
- graph.md: active
- vectors.md: active
- taxonomies.md: active
- standinginstructions.md: active | full
- threads-open.md: active | full
- threads-closed.md: active

## Protected Files

- secrets.md: protected
- secrets_git: never
