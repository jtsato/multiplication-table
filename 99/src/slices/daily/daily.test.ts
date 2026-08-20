import { describe, expect, it } from 'vitest';
import {
  DAILY_EVENT_KINDS,
  eventForDay,
  gardenPlantedDay,
  harvestMultiplier,
  hasDailyEvent,
  whalePositionFor,
} from './daily.logic';

describe('eventForDay', () => {
  it('é determinístico e sempre devolve um evento válido', () => {
    for (let day = 1; day <= 50; day += 1) {
      const evento = eventForDay(day);
      expect(evento.day).toBe(day);
      expect(DAILY_EVENT_KINDS).toContain(evento.kind);
      expect(eventForDay(day)).toEqual(evento);
    }
  });

  it('nunca devolve dia menor que 1', () => {
    expect(eventForDay(-3).day).toBe(1);
  });
});

describe('harvestMultiplier', () => {
  it('só fartura dobra a colheita', () => {
    expect(harvestMultiplier('fartura')).toBe(2);
    expect(harvestMultiplier('chuva')).toBe(1);
    expect(harvestMultiplier('dia-comum')).toBe(1);
    expect(harvestMultiplier('visitante')).toBe(1);
    expect(harvestMultiplier('baleia-na-praia')).toBe(1);
  });
});

describe('gardenPlantedDay', () => {
  it('chuva faz a horta render no mesmo dia', () => {
    expect(gardenPlantedDay('chuva', 4)).toBe(3);
    expect(gardenPlantedDay('fartura', 4)).toBe(4);
  });
});

describe('whalePositionFor', () => {
  it('baleia-na-praia muda o lugar da baleia; os outros não', () => {
    expect(whalePositionFor('baleia-na-praia')).not.toBeNull();
    expect(whalePositionFor('dia-comum')).toBeNull();
    expect(whalePositionFor('chuva')).toBeNull();
  });
});

describe('hasDailyEvent', () => {
  it('dia comum não é evento; os demais são', () => {
    expect(hasDailyEvent('dia-comum')).toBe(false);
    expect(hasDailyEvent('chuva')).toBe(true);
    expect(hasDailyEvent('fartura')).toBe(true);
  });
});
