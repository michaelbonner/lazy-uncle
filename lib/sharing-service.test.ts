import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { SharingService, CreateSharingLinkOptions } from "./sharing-service";
import prisma from "./prisma";

// Mock the prisma client
vi.mock("./prisma", () => ({
  default: {
    sharingLink: {
      count: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

const mockPrisma = prisma as any;

describe("SharingService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset Date to a fixed time for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("createSharingLink", () => {
    const mockUserId = "user-123";
    const mockOptions: CreateSharingLinkOptions = {
      userId: mockUserId,
      description: "Test sharing link",
    };

    it("should create a sharing link with default expiration", async () => {
      // Mock rate limiting checks
      mockPrisma.sharingLink.count
        .mockResolvedValueOnce(0) // Active links count
        .mockResolvedValueOnce(0); // Daily links count

      // Mock unique token check
      mockPrisma.sharingLink.findUnique.mockResolvedValueOnce(null);

      // Mock successful creation
      const mockSharingLink = {
        id: "link-123",
        token: "mock-token",
        userId: mockUserId,
        description: "Test sharing link",
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 168 * 60 * 60 * 1000), // 7 days
        isActive: true,
      };
      mockPrisma.sharingLink.create.mockResolvedValueOnce(mockSharingLink);

      const result = await SharingService.createSharingLink(mockOptions);

      expect(result).toEqual(mockSharingLink);
      expect(mockPrisma.sharingLink.create).toHaveBeenCalledWith({
        data: {
          token: expect.any(String),
          userId: mockUserId,
          description: "Test sharing link",
          expiresAt: expect.any(Date),
          isActive: true,
        },
      });
    });

    it("should create a sharing link with custom expiration", async () => {
      const customOptions = { ...mockOptions, expirationHours: 24 };

      mockPrisma.sharingLink.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      mockPrisma.sharingLink.findUnique.mockResolvedValueOnce(null);

      const mockSharingLink = {
        id: "link-123",
        token: "mock-token",
        userId: mockUserId,
        description: "Test sharing link",
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        isActive: true,
      };
      mockPrisma.sharingLink.create.mockResolvedValueOnce(mockSharingLink);

      await SharingService.createSharingLink(customOptions);

      const createCall = mockPrisma.sharingLink.create.mock.calls[0][0];
      const expectedExpiration = new Date();
      expectedExpiration.setHours(expectedExpiration.getHours() + 24);

      expect(createCall.data.expiresAt).toEqual(expectedExpiration);
    });

    it("should throw error when max active links exceeded", async () => {
      mockPrisma.sharingLink.count.mockResolvedValueOnce(5); // Max active links

      await expect(
        SharingService.createSharingLink(mockOptions),
      ).rejects.toThrow("Maximum of 5 active sharing links allowed per user");
    });

    it("should throw error when daily generation limit exceeded", async () => {
      mockPrisma.sharingLink.count
        .mockResolvedValueOnce(0) // Active links count
        .mockResolvedValueOnce(3); // Daily links count (at limit)

      await expect(
        SharingService.createSharingLink(mockOptions),
      ).rejects.toThrow("Daily limit of 3 sharing links exceeded");
    });

    it("should generate unique token after collision", async () => {
      mockPrisma.sharingLink.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      // First token check returns existing link, second returns null (unique)
      mockPrisma.sharingLink.findUnique
        .mockResolvedValueOnce({ id: "existing" }) // Token collision
        .mockResolvedValueOnce(null); // Unique token

      const mockSharingLink = {
        id: "link-123",
        token: "unique-token",
        userId: mockUserId,
        createdAt: new Date(),
        expiresAt: new Date(),
        isActive: true,
      };
      mockPrisma.sharingLink.create.mockResolvedValueOnce(mockSharingLink);

      const result = await SharingService.createSharingLink(mockOptions);

      expect(result).toEqual(mockSharingLink);
      expect(mockPrisma.sharingLink.findUnique).toHaveBeenCalledTimes(2);
    });

    it("should throw error when unable to generate unique token", async () => {
      mockPrisma.sharingLink.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      // Always return existing link (simulate persistent collision)
      mockPrisma.sharingLink.findUnique.mockResolvedValue({ id: "existing" });

      await expect(
        SharingService.createSharingLink(mockOptions),
      ).rejects.toThrow(
        "Failed to generate unique token after multiple attempts",
      );
    });
  });

  describe("validateSharingLink", () => {
    it("should return null for invalid token types", async () => {
      expect(await SharingService.validateSharingLink("")).toBeNull();
      expect(await SharingService.validateSharingLink(null as any)).toBeNull();
      expect(await SharingService.validateSharingLink(123 as any)).toBeNull();
    });

    it("should return null for non-existent token", async () => {
      mockPrisma.sharingLink.findUnique.mockResolvedValueOnce(null);

      const result =
        await SharingService.validateSharingLink("non-existent-token");

      expect(result).toBeNull();
    });

    it("should return null for inactive link", async () => {
      const mockLink = {
        id: "link-123",
        token: "test-token",
        isActive: false,
        expiresAt: new Date(Date.now() + 1000000),
        user: { id: "user-123" },
      };
      mockPrisma.sharingLink.findUnique.mockResolvedValueOnce(mockLink);

      const result = await SharingService.validateSharingLink("test-token");

      expect(result).toBeNull();
    });

    it("should deactivate and return null for expired link", async () => {
      const mockLink = {
        id: "link-123",
        token: "test-token",
        isActive: true,
        expiresAt: new Date(Date.now() - 1000), // Expired
        user: { id: "user-123" },
      };
      mockPrisma.sharingLink.findUnique.mockResolvedValueOnce(mockLink);
      mockPrisma.sharingLink.update.mockResolvedValueOnce(mockLink);

      const result = await SharingService.validateSharingLink("test-token");

      expect(result).toBeNull();
      expect(mockPrisma.sharingLink.update).toHaveBeenCalledWith({
        where: { id: "link-123" },
        data: { isActive: false },
      });
    });

    it("should return valid active link", async () => {
      const mockLink = {
        id: "link-123",
        token: "test-token",
        isActive: true,
        expiresAt: new Date(Date.now() + 1000000), // Future expiration
        user: { id: "user-123" },
      };
      mockPrisma.sharingLink.findUnique.mockResolvedValueOnce(mockLink);

      const result = await SharingService.validateSharingLink("test-token");

      expect(result).toEqual(mockLink);
    });
  });

  describe("getUserSharingLinks", () => {
    it("should return user sharing links with submission counts", async () => {
      const mockLinks = [
        {
          id: "link-1",
          token: "token-1",
          userId: "user-123",
          createdAt: new Date(),
          expiresAt: new Date(),
          isActive: true,
          description: "Link 1",
          _count: { submissions: 5 },
        },
        {
          id: "link-2",
          token: "token-2",
          userId: "user-123",
          createdAt: new Date(),
          expiresAt: new Date(),
          isActive: false,
          description: "Link 2",
          _count: { submissions: 2 },
        },
      ];
      mockPrisma.sharingLink.findMany.mockResolvedValueOnce(mockLinks);

      const result = await SharingService.getUserSharingLinks("user-123");

      expect(result).toHaveLength(2);
      expect(result[0].submissionCount).toBe(5);
      expect(result[1].submissionCount).toBe(2);
      expect(mockPrisma.sharingLink.findMany).toHaveBeenCalledWith({
        where: { userId: "user-123" },
        include: {
          _count: {
            select: {
              submissions: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    });
  });

  describe("getActiveSharingLinks", () => {
    it("should return only active non-expired links", async () => {
      const mockLinks = [
        {
          id: "link-1",
          token: "token-1",
          userId: "user-123",
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 1000000),
          isActive: true,
          description: "Active Link",
          _count: { submissions: 3 },
        },
      ];
      mockPrisma.sharingLink.findMany.mockResolvedValueOnce(mockLinks);

      const result = await SharingService.getActiveSharingLinks("user-123");

      expect(result).toHaveLength(1);
      expect(result[0].submissionCount).toBe(3);
      expect(mockPrisma.sharingLink.findMany).toHaveBeenCalledWith({
        where: {
          userId: "user-123",
          isActive: true,
          expiresAt: {
            gt: expect.any(Date),
          },
        },
        include: {
          _count: {
            select: {
              submissions: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    });
  });

  describe("revokeSharingLink", () => {
    it("should successfully revoke user's own link", async () => {
      const mockLink = {
        id: "link-123",
        token: "test-token",
        userId: "user-123",
        isActive: true,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        description: null,
      };

      mockPrisma.sharingLink.findFirst.mockResolvedValueOnce(mockLink);
      mockPrisma.sharingLink.update.mockResolvedValueOnce({
        ...mockLink,
        isActive: false,
      });

      const result = await SharingService.revokeSharingLink(
        "link-123",
        "user-123",
      );

      expect(result).toEqual({ ...mockLink, isActive: false });
      expect(mockPrisma.sharingLink.findFirst).toHaveBeenCalledWith({
        where: {
          id: "link-123",
          userId: "user-123",
        },
      });
      expect(mockPrisma.sharingLink.update).toHaveBeenCalledWith({
        where: {
          id: "link-123",
        },
        data: {
          isActive: false,
        },
      });
    });

    it("should return null when link not found or not owned by user", async () => {
      mockPrisma.sharingLink.findFirst.mockResolvedValueOnce(null);

      const result = await SharingService.revokeSharingLink(
        "link-123",
        "user-123",
      );

      expect(result).toBe(null);
    });
  });

  describe("cleanupExpiredLinks", () => {
    it("should deactivate expired links and return count", async () => {
      mockPrisma.sharingLink.updateMany.mockResolvedValueOnce({ count: 3 });

      const result = await SharingService.cleanupExpiredLinks();

      expect(result).toBe(3);
      expect(mockPrisma.sharingLink.updateMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          expiresAt: {
            lte: expect.any(Date),
          },
        },
        data: {
          isActive: false,
        },
      });
    });
  });

  describe("getSharingLinkById", () => {
    it("should return link for valid owner", async () => {
      const mockLink = {
        id: "link-123",
        token: "token-123",
        userId: "user-123",
        createdAt: new Date(),
        expiresAt: new Date(),
        isActive: true,
      };
      mockPrisma.sharingLink.findFirst.mockResolvedValueOnce(mockLink);

      const result = await SharingService.getSharingLinkById(
        "link-123",
        "user-123",
      );

      expect(result).toEqual(mockLink);
      expect(mockPrisma.sharingLink.findFirst).toHaveBeenCalledWith({
        where: {
          id: "link-123",
          userId: "user-123",
        },
      });
    });

    it("should return null for non-existent or unauthorized link", async () => {
      mockPrisma.sharingLink.findFirst.mockResolvedValueOnce(null);

      const result = await SharingService.getSharingLinkById(
        "link-123",
        "user-456",
      );

      expect(result).toBeNull();
    });
  });

  describe("canCreateSharingLink", () => {
    it("should allow creation when under limits", async () => {
      mockPrisma.sharingLink.count
        .mockResolvedValueOnce(2) // Active links count
        .mockResolvedValueOnce(1); // Daily links count

      const result = await SharingService.canCreateSharingLink("user-123");

      expect(result).toEqual({
        canCreate: true,
        activeLinksCount: 2,
        dailyLinksCount: 1,
      });
    });

    it("should prevent creation when active links limit exceeded", async () => {
      mockPrisma.sharingLink.count.mockResolvedValueOnce(5); // At max active links

      const result = await SharingService.canCreateSharingLink("user-123");

      expect(result).toEqual({
        canCreate: false,
        reason: "Maximum of 5 active sharing links allowed",
        activeLinksCount: 5,
        dailyLinksCount: 0,
      });
    });

    it("should prevent creation when daily limit exceeded", async () => {
      mockPrisma.sharingLink.count
        .mockResolvedValueOnce(2) // Active links count
        .mockResolvedValueOnce(3); // Daily links count (at limit)

      const result = await SharingService.canCreateSharingLink("user-123");

      expect(result).toEqual({
        canCreate: false,
        reason: "Daily limit of 3 sharing links exceeded",
        activeLinksCount: 2,
        dailyLinksCount: 3,
      });
    });
  });

  describe("token generation", () => {
    it("should generate tokens of correct length and format", async () => {
      mockPrisma.sharingLink.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      mockPrisma.sharingLink.findUnique.mockResolvedValueOnce(null);

      const mockSharingLink = {
        id: "link-123",
        token: "generated-token",
        userId: "user-123",
        createdAt: new Date(),
        expiresAt: new Date(),
        isActive: true,
      };
      mockPrisma.sharingLink.create.mockResolvedValueOnce(mockSharingLink);

      await SharingService.createSharingLink({ userId: "user-123" });

      const createCall = mockPrisma.sharingLink.create.mock.calls[0][0];
      const token = createCall.data.token;

      // Token should be a base64url string (URL-safe base64)
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/); // base64url character set
    });
  });
});
