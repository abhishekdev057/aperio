import { describe, expect, it } from "vitest";
import { calculateScore, classifySkill, inferSkill } from "@/lib/analyzer";

describe("Aperio analyzer", () => {
  it("captures evidence and a working level from applied resume language", () => {
    const result = inferSkill("Built and deployed a React dashboard with REST APIs.", ["react", "react.js"]);
    expect(result.level).toBe(2);
    expect(result.evidence[0]).toContain("React");
    expect(result.confidence).toBeGreaterThan(0.6);
  });

  it("uses constructive classifications", () => {
    expect(classifySkill(3, 3)).toBe("strong");
    expect(classifySkill(1, 3)).toBe("developing");
    expect(classifySkill(0, 3)).toBe("missing");
  });

  it("calculates a weighted normalized score", () => {
    expect(calculateScore([{ currentLevel: 3, targetLevel: 3, weight: 10 }, { currentLevel: 0, targetLevel: 3, weight: 10 }])).toBe(50);
  });
});
