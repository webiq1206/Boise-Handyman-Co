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
import { pickReadingImages, readingLinks, READING_FALLBACK_IMAGES, pageImage } from '../shared/exploreReading';
import { getServiceImageSet } from '../shared/serviceBackgrounds';

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

/** Every picture a landing page shows: its own three, the cards, then the reading list thumbnails. */
function wholePage(path: string, page: (string | undefined)[], cardRows: { serviceSlug: string; citySlug: string }[][], cardHrefs: string[]) {
  const shown = new Set<string>(page.filter((src): src is string => Boolean(src)));
  const pictures = [...shown];
  for (const row of cardRows) for (const pick of pickCardImages(row, shown)) if (pick.src) pictures.push(pick.src);
  const links = readingLinks(path, new Set(cardHrefs), cardRows.length > 0);
  const picks = pickReadingImages(links, shown);
  for (const pick of picks) if (pick.src) pictures.push(pick.src);
  return { pictures, links, picks };
}

function assertDistinct(path: string, pictures: string[]) {
  const seen = new Set<string>();
  for (const src of pictures) {
    assert.equal(seen.has(src), false, `${path} shows ${src} twice`);
    seen.add(src);
  }
}

test('service pages: hero, inline photographs and reading thumbnails never repeat a picture', () => {
  for (const service of SERVICES) {
    const set = getServiceImageSet(service.slug);
    const path = `/services/${service.slug}`;
    assertDistinct(path, wholePage(path, [set.hero, set.breather, set.process], [], []).pictures);
  }
});

test('service-in-city pages: hero, inline photographs, cards and reading thumbnails never repeat a picture', () => {
  for (const service of SERVICES) {
    for (const city of SERVICE_AREA_CITIES) {
      const set = getCityServiceImageSet(service.slug, city.slug);
      const nearby = SERVICE_AREA_CITIES.filter((c) => c.slug !== city.slug).map((c) => ({ serviceSlug: service.slug, citySlug: c.slug }));
      const others = SERVICES.filter((s) => s.slug !== service.slug).slice(0, 4).map((s) => ({ serviceSlug: s.slug, citySlug: city.slug }));
      const hrefs = [...nearby, ...others].map((c) => `/services/${c.serviceSlug}/${c.citySlug}`);
      const path = `/services/${service.slug}/${city.slug}`;
      assertDistinct(path, wholePage(path, [set.hero, set.breather, set.process], [nearby, others], hrefs).pictures);
    }
  }
});

test('a reading thumbnail is the linked page\'s own photograph or a general picture, never another trade\'s work', () => {
  for (const service of SERVICES) {
    for (const city of SERVICE_AREA_CITIES) {
      const set = getCityServiceImageSet(service.slug, city.slug);
      const path = `/services/${service.slug}/${city.slug}`;
      const { links, picks } = wholePage(path, [set.hero, set.breather, set.process], [], []);
      picks.forEach((pick, i) => {
        if (!pick.src) return;
        if (pick.own) assert.equal(pick.src, pageImage(links[i].href), `${path}: ${links[i].href} shows its own photograph`);
        else assert.ok(READING_FALLBACK_IMAGES.includes(pick.src), `${path}: ${pick.src} is not a general picture`);
      });
    }
  }
});

test('every reading row has a thumbnail on service and service-in-city pages', () => {
  for (const service of SERVICES) {
    const overview = getServiceImageSet(service.slug);
    const pages: [string, (string | undefined)[], { serviceSlug: string; citySlug: string }[][]][] = [
      [`/services/${service.slug}`, [overview.hero, overview.breather, overview.process], []],
    ];
    for (const city of SERVICE_AREA_CITIES) {
      const set = getCityServiceImageSet(service.slug, city.slug);
      const nearby = SERVICE_AREA_CITIES.filter((c) => c.slug !== city.slug).map((c) => ({ serviceSlug: service.slug, citySlug: c.slug }));
      const others = SERVICES.filter((s) => s.slug !== service.slug).slice(0, 4).map((s) => ({ serviceSlug: s.slug, citySlug: city.slug }));
      pages.push([`/services/${service.slug}/${city.slug}`, [set.hero, set.breather, set.process], [nearby, others]]);
    }
    for (const [path, page, rows] of pages) {
      const { links, picks } = wholePage(path, page, rows, []);
      picks.forEach((pick, i) => assert.ok(pick.src, `${path}: ${links[i].href} has no thumbnail`));
    }
  }
});
