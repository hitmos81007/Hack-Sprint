import { describe, expect, it } from "vitest";
import { locales, messages, modules } from "./i18n";

describe("landing page translations", () => {
  it.each(locales)("has complete, nonempty copy in %s", (locale) => {
    const copy = messages[locale];
    expect(Object.keys(copy).sort()).toEqual(Object.keys(messages.en).sort());
    expect(Object.keys(copy.cards).sort()).toEqual([...modules].sort());
    for (const text of Object.values(copy).filter((value) => typeof value === "string")) {
      expect(text.trim().length).toBeGreaterThan(0);
    }
    for (const card of Object.values(copy.cards)) {
      expect(card.title.trim().length).toBeGreaterThan(0);
      expect(card.description.trim().length).toBeGreaterThan(0);
    }
  });
});

import * as dictionaries from "./i18n";
function shape(value:unknown):unknown{if(Array.isArray(value))return value.map(shape);if(value&&typeof value==="object")return Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,shape(v)]));expect(typeof value).toBe("string");expect((value as string).trim().length).toBeGreaterThan(0);return "string";}
for(const [name,value] of Object.entries(dictionaries)){
 if(value&&typeof value==="object"&&"en" in value&&"hi" in value&&"ta" in value){
  it(`${name} covers every nested string and list in en/hi/ta`,()=>{const d=value as Record<string,unknown>;expect(shape(d.hi)).toEqual(shape(d.en));expect(shape(d.ta)).toEqual(shape(d.en));});
 }
}
