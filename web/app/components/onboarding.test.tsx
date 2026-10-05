import { describe, expect, it, vi, beforeEach } from "vitest";
vi.mock("../../lib/auth", () => ({ requirePageRole: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { renderToStaticMarkup } from "react-dom/server";
import { requirePageRole } from "../../lib/auth";
import Issuer, { dynamic as issuerDynamic } from "../issuer/page";
import Root, { dynamic as rootDynamic } from "../root/page";
import Officer, { dynamic as officerDynamic } from "../officer/page";
const userId = "00000000-0000-4000-8000-000000000001";
beforeEach(() => { vi.mocked(requirePageRole).mockReset(); });
describe("protected onboarding pages", () => {
  it("renders public-key forms without generating a key during server rendering", async () => {
    vi.mocked(requirePageRole).mockResolvedValue({ id: userId, role: "citizen" } as Awaited<ReturnType<typeof requirePageRole>>);
    const issuer = renderToStaticMarkup(await Issuer());
    expect(issuer).toContain("Submit application"); expect(issuer).toContain('type="password"');
    expect(issuer).toContain("Only your public address and signatures are submitted");
    expect(issuer).not.toContain("privateKey");
    expect(vi.mocked(requirePageRole)).toHaveBeenLastCalledWith(["citizen", "issuer_admin"]);
    expect(renderToStaticMarkup(await Officer())).toContain("Select an active institution");
    expect(vi.mocked(requirePageRole)).toHaveBeenLastCalledWith(["citizen", "officer"]);
  });
  it("requires root access and prevents account pages from being statically cached", async () => {
    expect([issuerDynamic, rootDynamic, officerDynamic]).toEqual(["force-dynamic", "force-dynamic", "force-dynamic"]);
    vi.mocked(requirePageRole).mockRejectedValue(new Error("FORBIDDEN"));
    await expect(Root()).rejects.toThrow("FORBIDDEN");
    expect(requirePageRole).toHaveBeenCalledWith("root_authority");
  });
});
