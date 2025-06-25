import {
  estimateCaloriesFromSteps,
  shouldProcessAsSteps,
  processStepsActivity,
} from '../processStepsActivity';

describe('estimateCaloriesFromSteps', () => {
  it('returns 0 for 0 steps', () => {
    expect(estimateCaloriesFromSteps(0)).toBe(0);
  });
  it('calculates calories for positive steps', () => {
    expect(estimateCaloriesFromSteps(1000)).toBe(40);
    expect(estimateCaloriesFromSteps(1234)).toBe(Math.round(1234 * 0.04));
  });
  it('handles negative steps', () => {
    expect(estimateCaloriesFromSteps(-100)).toBe(Math.round(-100 * 0.04));
  });
});

describe('shouldProcessAsSteps', () => {
  it('returns true for walking/steps with steps and no duration/calories', () => {
    expect(shouldProcessAsSteps({ name: 'Walking', total_steps: 1000 })).toBe(true);
    expect(shouldProcessAsSteps({ name: 'Steps', total_steps: 500 })).toBe(true);
  });
  it('returns false if name does not include walking/steps', () => {
    expect(shouldProcessAsSteps({ name: 'Running', total_steps: 1000 })).toBe(false);
  });
  it('returns false if no steps', () => {
    expect(shouldProcessAsSteps({ name: 'Steps', total_steps: 0 })).toBe(false);
  });
  it('returns false if duration or calories present', () => {
    expect(shouldProcessAsSteps({ name: 'Steps', total_steps: 100, duration: 10 })).toBe(false);
    expect(shouldProcessAsSteps({ name: 'Steps', total_steps: 100, total_energy_burned: 5 })).toBe(
      false,
    );
  });
});

describe('processStepsActivity', () => {
  it('returns processed activity for valid steps activity', () => {
    const input = { name: 'Steps', total_steps: 1000 };
    const result = processStepsActivity(input);
    expect(result.name).toBe('Steps');
    expect(result.total_energy_burned).toBe(40);
  });
  it('returns original activity if not steps', () => {
    const input = { name: 'Running', total_steps: 1000 };
    expect(processStepsActivity(input)).toEqual(input);
  });
});
