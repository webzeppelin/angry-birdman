// Constants entry point
// Will be populated with action codes and other constants

export const ACTION_CODES = {
  HOLD: 'HOLD',
  WARN: 'WARN',
  KICK: 'KICK',
  RESERVE: 'RESERVE',
  PASS: 'PASS',
} as const;

export type ActionCode = (typeof ACTION_CODES)[keyof typeof ACTION_CODES];
