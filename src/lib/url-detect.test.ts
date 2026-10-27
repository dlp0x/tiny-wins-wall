import { describe, expect, it } from "vitest";
import { containsUrl } from "./url-detect";
import { isValidWin } from "./wins-api";

describe("containsUrl — refused", () => {
  it.each([
    "Visitez https://example.com",
    "Mon projet est sur www.example.com",
    "Mon site est example.com",
    "Consultez EXAMPLE.COM pour en savoir plus.",
    "go to http://foo",
    "www . example . ca",
    "example[.]org",
    "example (dot) com",
    "example dot com",
    "monsite point fr",
    "example . com",
    "The server address is 192.168.1.10",
    "javascript:alert(1)",
    "HTTPS://Example.Net/x",
    "sub.example.co.uk",
  ])("%s", (t) => {
    expect(containsUrl(t)).toBe(true);
    expect(isValidWin(t)).toBe(false);
  });
});

describe("containsUrl — accepted", () => {
  it.each([
    "J'ai enfin lancé mon site !",
    "J'ai enfin appris à programmer en JavaScript.",
    "J'ai enfin compris le fonctionnement du HTML.",
    "I finished. Me, finally!",
    "J'ai fini. Ça va mieux.",
    "Learned Node.js today",
    "Node.js is useful",
    "<script>alert(1)</script> made me laugh",
    "Ratio 3.5 to 1, and it worked",
  ])("%s", (t) => {
    expect(containsUrl(t)).toBe(false);
    expect(isValidWin(t)).toBe(true);
  });
});
