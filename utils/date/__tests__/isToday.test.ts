import { isToday } from '../isToday';

describe('isToday', () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  it('returns true for today', () => {
    expect(isToday(todayStr)).toBe(true);
  });

  it('returns false for yesterday', () => {
    const yest = new Date(today);
    yest.setDate(today.getDate() - 1);
    const yestStr = `${yest.getFullYear()}-${String(yest.getMonth() + 1).padStart(2, '0')}-${String(
      yest.getDate(),
    ).padStart(2, '0')}`;
    expect(isToday(yestStr)).toBe(false);
  });

  it('returns false for tomorrow', () => {
    const tomo = new Date(today);
    tomo.setDate(today.getDate() + 1);
    const tomoStr = `${tomo.getFullYear()}-${String(tomo.getMonth() + 1).padStart(2, '0')}-${String(
      tomo.getDate(),
    ).padStart(2, '0')}`;
    expect(isToday(tomoStr)).toBe(false);
  });

  it('returns false for invalid date', () => {
    expect(isToday('not-a-date')).toBe(false);
    expect(isToday('2024-99-99')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isToday('')).toBe(false);
  });
});
