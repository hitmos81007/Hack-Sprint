import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "./page";
import { Portal } from "./components/portal";

describe("public navigation", () => {
  it("renders five linked landing cards and a health link", () => {
    const html = renderToStaticMarkup(<Home />);
    for (const route of ["verify", "analyze", "registry", "officer", "login"]) {
      expect(html).toContain(`href="/${route}"`);
    }
    expect(html.match(/<h2/g)).toHaveLength(5);
    expect(html).toContain('href="/api/health"');
  });
  it("labels unfinished functionality and offers navigation home", () => {
    const html = renderToStaticMarkup(<Portal module="registry" />);
    expect(html).toContain("Coming soon");
    expect(html).toContain("UPI Guard is a simulation");
    expect(html).toContain("Back to home");
  });
});
