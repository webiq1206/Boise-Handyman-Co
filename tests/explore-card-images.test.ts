/**
 * Keep exploring cards never repeat a photograph (owner, 19 November 2026).
 * On every service-in-city page, no two cards share a picture and no card
 * shows a picture the page already carries. A trade with too few photographs
 * (electrical has seven, a page and its eight nearby cards need eleven) hands the card its city's area photograph; work from
 * another trade never fills the card.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SERVICES, SERVICE_AREA_CITIES } from '../shared/contentData';
import {
  CITY_HERO_IMAGES,
  CITY_SERVICE_IMAGES,
  getAreaImageSet,
  getCityServiceImageSet,
  pickCardImages,
} from '../shared/cityServiceImages';

const tradePhotos = (service: string) =>
  new Set(Object.entries(CITY_SERVICE_IMAGES).filter(([key]) => key.startsWith(`${service}/`)).map(([, src]) => src));

function cardsFor(serviceSlug: string, citySlug: string) {
  const set = getCityServiceImageSet(serviceSlug, citySlug);
  const page = [set.hero, set.breather, set.process];
  const shown = new Set<string>(page);
  const nearby = SERVICE_AREA_CITIES.filter((c) => c.slug !== citySlug).map((c) => ({ serviceSlug, citySlug: c.slug }));
  const others = SERVICES.filter((s) => s.slug !== serviceSlug).slice(0, 4).map((s) => ({ serviceSlug: s.slug, citySlug }));
  const cards = [...nearby, ...others];
  return { page, cards, picks: [...pickCardImages(nearby, shown), ...pickCardImages(others, shown)] };
}

test('no card on a service-in-city page repeats a photograph of the page or of another card', () => {
  for (const service of SERVICES) {
    for (const city of SERVICE_AREA_CITIES) {
      const { page, picks } = cardsFor(service.slug, city.slug);
      const seen = new Set<string>(page);
      for (const pick of picks) {
        if (!pick.src) continue;
        assert.equal(seen.has(pick.src), false, `${service.slug}/${city.slug} repeats ${pick.src}`);
        seen.add(pick.src);
      }
    }
  }
});

test('a card shows its own trade, or its city, and nothing else', () => {
  for (const service of SERVICES) {
    for (const city of SERVICE_AREA_CITIES) {
      const { cards, picks } = cardsFor(service.slug, city.slug);
      picks.forEach((pick, i) => {
        if (!pick.src) return;
        if (pick.area) assert.equal(pick.src, CITY_HERO_IMAGES[cards[i].citySlug], `${service.slug}/${city.slug}: area photo of the card's own city`);
        else assert.ok(tradePhotos(cards[i].serviceSlug).has(pick.src), `${service.slug}/${city.slug}: ${pick.src} is ${cards[i].serviceSlug} work`);
      });
    }
  }
});

test('electrical pages: every nearby-city card has a photograph, the trade ones first', () => {
  for (const city of SERVICE_AREA_CITIES) {
    const { picks } = cardsFor('electrical-repairs', city.slug);
    const nearby = picks.slice(0, SERVICE_AREA_CITIES.length - 1);
    assert.ok(nearby.every((pick) => pick.src), `${city.slug}: a nearby card has no photograph`);
    assert.ok(nearby.some((pick) => pick.area), `${city.slug}: seven electrical pictures cannot fill a page and eight cards`);
  }
});

test('area pages: the service cards do not repeat the page or each other', () => {
  for (const city of SERVICE_AREA_CITIES) {
    const set = getAreaImageSet(city.slug);
    const shown = new Set<string>([set.hero, set.breather, set.process]);
    const before = new Set(shown);
    const picks = pickCardImages(SERVICES.map((s) => ({ serviceSlug: s.slug, citySlug: city.slug })), shown);
    const seen = new Set(before);
    for (const pick of picks) {
      if (!pick.src) continue;
      assert.equal(seen.has(pick.src), false, `${city.slug} repeats ${pick.src}`);
      seen.add(pick.src);
    }
  }
});
