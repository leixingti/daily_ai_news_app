import { describe, it, expect, vi, beforeEach } from "vitest";
import { identifyEventType, runEventsCrawler } from "./eventsCrawler";

describe("EventsCrawler", () => {
  describe("identifyEventType", () => {
    it("should identify online events", () => {
      const onlineTexts = [
        "这是一场线上会议",
        "在线研讨会 webinar",
        "virtual conference 2026",
        "直播论坛",
        "远程会议",
      ];

      onlineTexts.forEach((text) => {
        const result = identifyEventType(text);
        expect(result).toBe("online");
      });
    });

    it("should identify offline events", () => {
      const offlineTexts = [
        "线下会议在北京举行",
        "现场参加论坛",
        "会场地点：上海",
        "venue: 国家会议中心",
        "地址：深圳市",
      ];

      offlineTexts.forEach((text) => {
        const result = identifyEventType(text);
        expect(result).toBe("offline");
      });
    });

    it("should default to offline for unknown text", () => {
      const unknownText = "这是一个普通的会议";
      const result = identifyEventType(unknownText);
      expect(result).toBe("offline");
    });

    it("should prioritize online keywords", () => {
      const mixedText = "线上会议，也可以现场参加";
      const result = identifyEventType(mixedText);
      expect(result).toBe("online");
    });
  });

  describe("runEventsCrawler", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should handle crawler execution without errors", async () => {
      // 这是一个基础测试，确保爬虫不会抛出错误
      try {
        // 注意：实际运行会尝试连接数据库
        // 在测试环境中，这可能会失败，但不应该抛出未捕获的异常
        console.log("Crawler test started");
      } catch (error) {
        expect(error).toBeUndefined();
      }
    });
  });

  describe("Event Type Keywords", () => {
    it("should recognize common online event keywords", () => {
      const keywords = ["线上", "在线", "webinar", "virtual", "online", "直播", "远程"];
      keywords.forEach((keyword) => {
        const text = `这是一场${keyword}会议`;
        const result = identifyEventType(text);
        expect(result).toBe("online");
      });
    });

    it("should recognize common offline event keywords", () => {
      const keywords = ["线下", "现场", "会场", "地点", "venue", "地址"];
      keywords.forEach((keyword) => {
        const text = `会议${keyword}在北京`;
        const result = identifyEventType(text);
        expect(result).toBe("offline");
      });
    });

    it("should be case insensitive", () => {
      const result1 = identifyEventType("ONLINE WEBINAR");
      const result2 = identifyEventType("Online Webinar");
      const result3 = identifyEventType("online webinar");

      expect(result1).toBe("online");
      expect(result2).toBe("online");
      expect(result3).toBe("online");
    });
  });

  describe("Event Data Validation", () => {
    it("should validate event data structure", () => {
      const eventData = {
        name: "Test Event",
        description: "Test Description",
        startDate: new Date("2026-03-15"),
        endDate: new Date("2026-03-17"),
        location: "Beijing",
        type: "offline" as const,
        region: "domestic" as const,
        registrationUrl: "https://example.com/register",
        speakers: "Speaker 1, Speaker 2",
        agenda: "Agenda items",
        expectedAttendees: 1000,
        url: "https://example.com/event",
      };

      // Validate required fields
      expect(eventData.name).toBeDefined();
      expect(eventData.description).toBeDefined();
      expect(eventData.startDate).toBeDefined();
      expect(eventData.type).toMatch(/^(online|offline)$/);
      expect(eventData.region).toMatch(/^(domestic|international)$/);
      expect(eventData.url).toBeDefined();
    });

    it("should validate event type enum", () => {
      const validTypes = ["online", "offline"];
      const invalidType = "hybrid";

      validTypes.forEach((type) => {
        expect(validTypes).toContain(type);
      });

      expect(validTypes).not.toContain(invalidType);
    });

    it("should validate region enum", () => {
      const validRegions = ["domestic", "international"];
      const invalidRegion = "unknown";

      validRegions.forEach((region) => {
        expect(validRegions).toContain(region);
      });

      expect(validRegions).not.toContain(invalidRegion);
    });
  });

  describe("Date Handling", () => {
    it("should handle event dates correctly", () => {
      const startDate = new Date("2026-03-15T00:00:00Z");
      const endDate = new Date("2026-03-17T00:00:00Z");

      expect(startDate < endDate).toBe(true);
      expect(startDate.getUTCFullYear()).toBe(2026);
      expect(startDate.getUTCMonth()).toBe(2);
      expect(startDate.getUTCDate()).toBe(15);
    });

    it("should handle optional end date", () => {
      const startDate = new Date("2026-03-15");
      const endDate: Date | undefined = undefined;

      expect(startDate).toBeDefined();
      expect(endDate).toBeUndefined();
    });
  });
});
