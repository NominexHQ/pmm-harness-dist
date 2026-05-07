# PMM Configuration

Profile: lite
Intent: simple setup, smaller models, and lower context usage.

Settings that control how Poor Man's Memory behaves.

## Save Cadence

- Mode: every-milestone

## Commit Behaviour

- Mode: auto-commit

## Push Behaviour

- Mode: manual

## Sliding Window Size

<!-- Session-start load window only. PMM does not truncate memory files on disk. -->
- Timeline max: 20
- Summaries max: 5
<!-- Presets: light (20/5) | moderate (30/10) | heavy (50/20) | unlimited -->

## Verbosity

- Mode: summary

## Maintain Agent Model

- Model: haiku

## Repository Visibility

- Visibility: public

## Readonly Agent Model

- Readonly model: haiku

## Session Start

- Mode: lazy

## Maintain Strategy

- Strategy: single

## Recall Beyond Window

- Mode: prompt

## Context Tiers

- Mode: tiered

## Memory Priority

- Mode: pmm-first

## Pre-Compact Hook

- pre_compact: on

## Active Files

- memory.md: active | full
- assets.md: inactive
- decisions.md: active | head:10
- processes.md: inactive
- preferences.md: inactive
- voices.md: inactive
- lessons.md: active | tail:5
- timeline.md: active | tail:5
- summaries.md: active | full
- progress.md: active | full
- last.md: active | full
- graph.md: inactive
- vectors.md: inactive
- taxonomies.md: inactive
- standinginstructions.md: active | full
- threads-open.md: active | full
- threads-closed.md: active

## Protected Files

- secrets.md: protected
- secrets_git: never
