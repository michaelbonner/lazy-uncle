import { SharingLink } from "../drizzle/schema";
import { CreateSharingLinkOptions, SharingService } from "./sharing-service";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the db client
vi.mock("./db", () => {
  const mockInsert = vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: vi.fn(),
    }),
  });
  const mockUpdate = vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn(),
      }),
    }),
  });
  return {
    default: {
      insert: mockInsert,
      update: mockUpdate,
      query: {
        sharingLinks: {
          findMany: vi.fn(),
          findFirst: vi.fn(),
        },
      },
    },
  };
});

const mockDb = vi.mocked(await import("./db"), true).default;
const mockInsert = mockDb.insert as ReturnType<typeof vi.fn>;
const mockUpdate = mockDb.update as ReturnType<typeof vi.fn>;

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
      mockDb.query.sharingLinks.findMany
        .mockResolvedValueOnce([]) // Active links count
        .mockResolvedValueOnce([]); // Daily links count

      // Mock unique token check
      mockDb.query.sharingLinks.findFirst.mockResolvedValueOnce(undefined);

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
      mockInsert().values().returning.mockResolvedValueOnce([mockSharingLink]);

      const result = await SharingService.createSharingLink(mockOptions);

      expect(result).toEqual(mockSharingLink);
      expect(mockInsert).toHaveBeenCalled();
      expect(mockInsert().values).toHaveBeenCalledWith(
        expect.objectContaining({
          token: expect.any(String),
          userId: mockUserId,
          description: "Test sharing link",
          expiresAt: expect.any(Date),
          isActive: true,
        }),
      );
    });

    it("should create a sharing link with custom expiration", async () => {
      const customOptions = { ...mockOptions, expirationHours: 24 };

      mockDb.query.sharingLinks.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockDb.query.sharingLinks.findFirst.mockResolvedValueOnce(undefined);

      const mockSharingLink = {
        id: "link-123",
        token: "mock-token",
        userId: mockUserId,
        description: "Test sharing link",
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        isActive: true,
      };
      // Set up the mock chain before calling
      const mockReturning = vi.fn().mockResolvedValueOnce([mockSharingLink]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      mockInsert.mockReturnValueOnce({ values: mockValues });

      await SharingService.createSharingLink(customOptions);

      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalled();
      const valuesCall = mockValues.mock.calls[0][0];
      const expectedExpiration = new Date();
      expectedExpiration.setHours(expectedExpiration.getHours() + 24);

      expect(valuesCall.expiresAt).toEqual(expectedExpiration);
    });

    it("should throw error when max active links exceeded", async () => {
      mockDb.query.sharingLinks.findMany.mockResolvedValueOnce(
        Array(5).fill({ id: "link", isActive: true }),
      ); // Max active links

      await expect(
        SharingService.createSharingLink(mockOptions),
      ).rejects.toThrow("Maximum of 5 active sharing links allowed per user");
    });

    it("should throw error when daily generation limit exceeded", async () => {
      mockDb.query.sharingLinks.findMany
        .mockResolvedValueOnce([]) // Active links count
        .mockResolvedValueOnce(Array(3).fill({ id: "link" })); // Daily links count (at limit)

      await expect(
        SharingService.createSharingLink(mockOptions),
      ).rejects.toThrow("Daily limit of 3 sharing links exceeded");
    });

    it("should generate unique token after collision", async () => {
      mockDb.query.sharingLinks.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      // First token check returns existing link, second returns undefined (unique)
      mockDb.query.sharingLinks.findFirst
        .mockResolvedValueOnce({ id: "existing" } as SharingLink) // Token collision
        .mockResolvedValueOnce(undefined); // Unique token

      const mockSharingLink = {
        id: "link-123",
        token: "unique-token",
        userId: mockUserId,
        createdAt: new Date(),
        expiresAt: new Date(),
        isActive: true,
      };
      mockInsert().values().returning.mockResolvedValueOnce([mockSharingLink]);

      const result = await SharingService.createSharingLink(mockOptions);

      expect(result).toEqual(mockSharingLink);
      expect(mockDb.query.sharingLinks.findFirst).toHaveBeenCalledTimes(2);
    });

    it("should throw error when unable to generate unique token", async () => {
      mockDb.query.sharingLinks.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      // Always return existing link (simulate persistent collision)
      mockDb.query.sharingLinks.findFirst.mockResolvedValue({
        id: "existing",
      } as SharingLink);

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
      expect(
        await SharingService.validateSharingLink(null as unknown as string),
      ).toBeNull();
      expect(
        await SharingService.validateSharingLink(123 as unknown as string),
      ).toBeNull();
    });

    it("should return null for non-existent token", async () => {
      mockDb.query.sharingLinks.findFirst.mockResolvedValueOnce(undefined);

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
        userId: "user-123",
        createdAt: new Date(),
        description: null,
      };
      mockDb.query.sharingLinks.findFirst.mockResolvedValueOnce(mockLink);

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
        userId: "user-123",
        createdAt: new Date(),
        description: null,
      };
      mockDb.query.sharingLinks.findFirst.mockResolvedValueOnce(mockLink);
      mockUpdate().set().where.mockResolvedValueOnce([mockLink]);

      const result = await SharingService.validateSharingLink("test-token");

      expect(result).toBeNull();
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockUpdate().set).toHaveBeenCalledWith({ isActive: false });
    });

    it("should return valid active link", async () => {
      const mockLink = {
        id: "link-123",
        token: "test-token",
        isActive: true,
        expiresAt: new Date(Date.now() + 1000000), // Future expiration
        user: { id: "user-123" },
        userId: "user-123",
        createdAt: new Date(),
        description: null,
      };
      mockDb.query.sharingLinks.findFirst.mockResolvedValueOnce(mockLink);

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
          submissions: Array(5).fill({ id: "sub" }),
        },
        {
          id: "link-2",
          token: "token-2",
          userId: "user-123",
          createdAt: new Date(),
          expiresAt: new Date(),
          isActive: false,
          description: "Link 2",
          submissions: Array(2).fill({ id: "sub" }),
        },
      ];
      mockDb.query.sharingLinks.findMany.mockResolvedValueOnce(mockLinks);

      const result = await SharingService.getUserSharingLinks("user-123");

      expect(result).toHaveLength(2);
      expect(result[0].submissionCount).toBe(5);
      expect(result[1].submissionCount).toBe(2);
      expect(mockDb.query.sharingLinks.findMany).toHaveBeenCalled();
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
          submissions: Array(3).fill({ id: "sub" }),
        },
      ];
      mockDb.query.sharingLinks.findMany.mockResolvedValueOnce(mockLinks);

      const result = await SharingService.getActiveSharingLinks("user-123");

      expect(result).toHaveLength(1);
      expect(result[0].submissionCount).toBe(3);
      expect(mockDb.query.sharingLinks.findMany).toHaveBeenCalled();
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

      mockDb.query.sharingLinks.findFirst.mockResolvedValueOnce(mockLink);
      const mockReturning = vi.fn().mockResolvedValueOnce([
        {
          ...mockLink,
          isActive: false,
        },
      ]);
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
      mockUpdate.mockReturnValueOnce({ set: mockSet });

      const result = await SharingService.revokeSharingLink(
        "link-123",
        "user-123",
      );

      expect(result).toEqual({ ...mockLink, isActive: false });
      expect(mockDb.query.sharingLinks.findFirst).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith({ isActive: false });
    });

    it("should return null when link not found or not owned by user", async () => {
      mockDb.query.sharingLinks.findFirst.mockResolvedValueOnce(undefined);

      const result = await SharingService.revokeSharingLink(
        "link-123",
        "user-123",
      );

      expect(result).toBe(null);
    });
  });

  describe("cleanupExpiredLinks", () => {
    it("should deactivate expired links and return count", async () => {
      const expiredLinks = Array(3).fill({
        id: "link",
        isActive: true,
        expiresAt: new Date(Date.now() - 1000),
      });
      mockDb.query.sharingLinks.findMany.mockResolvedValueOnce(expiredLinks);
      mockUpdate().set().where.mockResolvedValue([{}]);

      const result = await SharingService.cleanupExpiredLinks();

      expect(result).toBe(3);
      expect(mockDb.query.sharingLinks.findMany).toHaveBeenCalled();
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
        description: null,
      };
      mockDb.query.sharingLinks.findFirst.mockResolvedValueOnce(mockLink);

      const result = await SharingService.getSharingLinkById(
        "link-123",
        "user-123",
      );

      expect(result).toEqual(mockLink);
      expect(mockDb.query.sharingLinks.findFirst).toHaveBeenCalled();
    });

    it("should return null for non-existent or unauthorized link", async () => {
      mockDb.query.sharingLinks.findFirst.mockResolvedValueOnce(undefined);

      const result = await SharingService.getSharingLinkById(
        "link-123",
        "user-456",
      );

      expect(result).toBeNull();
    });
  });

  describe("canCreateSharingLink", () => {
    it("should allow creation when under limits", async () => {
      mockDb.query.sharingLinks.findMany
        .mockResolvedValueOnce(Array(2).fill({ id: "link" })) // Active links count
        .mockResolvedValueOnce(Array(1).fill({ id: "link" })); // Daily links count

      const result = await SharingService.canCreateSharingLink("user-123");

      expect(result).toEqual({
        canCreate: true,
        activeLinksCount: 2,
        dailyLinksCount: 1,
      });
    });

    it("should prevent creation when active links limit exceeded", async () => {
      mockDb.query.sharingLinks.findMany.mockResolvedValueOnce(
        Array(5).fill({ id: "link" }),
      ); // At max active links

      const result = await SharingService.canCreateSharingLink("user-123");

      expect(result).toEqual({
        canCreate: false,
        reason: "Maximum of 5 active sharing links allowed",
        activeLinksCount: 5,
        dailyLinksCount: 0,
      });
    });

    it("should prevent creation when daily limit exceeded", async () => {
      mockDb.query.sharingLinks.findMany
        .mockResolvedValueOnce(Array(2).fill({ id: "link" })) // Active links count
        .mockResolvedValueOnce(Array(3).fill({ id: "link" })); // Daily links count (at limit)

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
      mockDb.query.sharingLinks.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockDb.query.sharingLinks.findFirst.mockResolvedValueOnce(undefined);

      const mockSharingLink = {
        id: "link-123",
        token: "generated-token",
        userId: "user-123",
        createdAt: new Date(),
        expiresAt: new Date(),
        isActive: true,
        description: null,
      };
      // Set up the mock chain before calling
      const mockReturning = vi.fn().mockResolvedValueOnce([mockSharingLink]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      mockInsert.mockReturnValueOnce({ values: mockValues });

      await SharingService.createSharingLink({ userId: "user-123" });

      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalled();
      const valuesCall = mockValues.mock.calls[0][0];
      const token = valuesCall.token;

      // Token should be a base64url string (URL-safe base64)
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/); // base64url character set
    });
  });
});
