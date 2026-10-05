import {renderToStaticMarkup} from "react-dom/server";
import {it,expect} from "vitest";
import {DemoPanel} from "./demo-panel";
import {DashboardPanel,metricLabel} from "./dashboard-panel";
import {locales,verificationMessages,demoMessages} from "../../lib/i18n";
it("exposes the six-step, zero-setup rehearsal and distinguishes connected delivery / testnet",()=>{const html=renderToStaticMarkup(<DemoPanel/>);expect(html).toContain("90-second guided demo");expect(html).toContain("Next step");for(const step of demoMessages.en.steps)expect(html).toContain(step.replaceAll("&","&amp;"));expect(html).toContain("simulated DB");expect(html).toContain("PUBLIC seed fixture");expect(html).not.toContain("privateKey");});
it("dashboard has a visible loading/error path and all result labels are localized",()=>{expect(renderToStaticMarkup(<DashboardPanel role="citizen"/>)).toContain("Impact dashboard");for(const locale of locales){expect(metricLabel("verifications","VERIFIED_AUTHORIZED",locale)).toBe(verificationMessages[locale].results.VERIFIED_AUTHORIZED);expect(metricLabel("reports","phone",locale).length).toBeGreaterThan(0);expect(metricLabel("analyses","HIGH",locale).length).toBeGreaterThan(0);}});
