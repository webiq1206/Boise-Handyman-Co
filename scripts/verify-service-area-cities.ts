import assert from "node:assert/strict";
import {
  CITIES,
  SERVICE_AREA_CITY_NAMES,
  isServiceAreaCity,
} from "../shared/contentData";
import { RE10_SERVICE_AREAS } from "../shared/content/re10Content";

const expected = [
  "Boise",
  "Meridian",
  "Eagle",
  "Nampa",
  "Kuna",
  "Star",
  "Middleton",
  "Garden City",
  "Caldwell",
];

assert.deepEqual(SERVICE_AREA_CITY_NAMES, expected, "handyman selector exposes all nine cities");
assert.deepEqual(RE10_SERVICE_AREAS, expected, "RE-10 service areas expose the same nine cities");
assert.equal(CITIES.length, 9, "there are exactly nine customer service-area options");

for (const city of expected) {
  assert.equal(isServiceAreaCity(city), true, `${city} is accepted by estimate lead validation`);
}

assert.equal(isServiceAreaCity("Garden City"), true, "Garden City is accepted");
assert.equal(isServiceAreaCity("Outside Service Area"), false, "unknown cities are rejected");

console.log("verify-service-area-cities: all nine cities passed");