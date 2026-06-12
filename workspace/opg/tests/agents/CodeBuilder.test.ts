import { describe, it, expect } from 'vitest';
import { CodeBuilderAgent } from '../../src/agents/CodeBuilderAgent';

describe('CodeBuilderAgent', () => {
  it('has build() method', () => {
    const agent = new CodeBuilderAgent({} as any);
    expect(typeof agent.build).toBe('function');
  });
});