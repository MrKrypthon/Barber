import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { SuperAdminAuthService } from "./superadmin-auth.service";

describe("SuperAdminAuthService", () => {
  let service: SuperAdminAuthService;
  let prisma: {
    superAdmin: { findUnique: jest.Mock; update: jest.Mock };
  };
  let jwtService: { sign: jest.Mock; verifyAsync: jest.Mock };
  let config: { getOrThrow: jest.Mock };

  const baseSuperAdmin = {
    id: "sa-1",
    name: "Admin",
    email: "admin@barber.test",
    password: "irrelevant-in-most-tests",
    tokenVersion: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    prisma = {
      superAdmin: { findUnique: jest.fn(), update: jest.fn() },
    };
    jwtService = {
      sign: jest.fn().mockReturnValue("signed-token"),
      verifyAsync: jest.fn(),
    };
    config = { getOrThrow: jest.fn((key: string) => `test-${key}`) };

    service = new SuperAdminAuthService(
      prisma as unknown as PrismaService,
      jwtService as unknown as JwtService,
      config as unknown as ConfigService,
    );
  });

  describe("login", () => {
    it("rechaza correo inexistente", async () => {
      prisma.superAdmin.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: "nope@example.com", password: "whatever" }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("rechaza contraseña incorrecta", async () => {
      const hashed = await bcrypt.hash("correct-password", 4);
      prisma.superAdmin.findUnique.mockResolvedValue({ ...baseSuperAdmin, password: hashed });

      await expect(
        service.login({ email: baseSuperAdmin.email, password: "wrong-password" }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("acepta credenciales correctas y devuelve tokens sin exponer el hash", async () => {
      const hashed = await bcrypt.hash("correct-password", 4);
      prisma.superAdmin.findUnique.mockResolvedValue({ ...baseSuperAdmin, password: hashed });

      const result = await service.login({
        email: baseSuperAdmin.email,
        password: "correct-password",
      });

      expect(result.accessToken).toBe("signed-token");
      expect(result.superAdmin).toEqual({
        id: baseSuperAdmin.id,
        name: baseSuperAdmin.name,
        email: baseSuperAdmin.email,
      });
    });
  });

  describe("refresh", () => {
    it("rechaza un token con firma/formato inválido", async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error("bad token"));

      await expect(service.refresh({ refreshToken: "garbage" })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it("rechaza si el tokenVersion no coincide (revocado por logout)", async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: "sa-1", tokenVersion: 0 });
      prisma.superAdmin.findUnique.mockResolvedValue({ ...baseSuperAdmin, tokenVersion: 1 });

      await expect(service.refresh({ refreshToken: "stale" })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it("emite nuevos tokens y rota tokenVersion", async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: "sa-1", tokenVersion: 0 });
      prisma.superAdmin.findUnique.mockResolvedValue(baseSuperAdmin);
      prisma.superAdmin.update.mockResolvedValue({ ...baseSuperAdmin, tokenVersion: 1 });

      const result = await service.refresh({ refreshToken: "valid" });

      expect(prisma.superAdmin.update).toHaveBeenCalledWith({
        where: { id: "sa-1" },
        data: { tokenVersion: { increment: 1 } },
      });
      expect(result.accessToken).toBe("signed-token");
    });
  });

  describe("logout", () => {
    it("incrementa el tokenVersion", async () => {
      await service.logout("sa-1");
      expect(prisma.superAdmin.update).toHaveBeenCalledWith({
        where: { id: "sa-1" },
        data: { tokenVersion: { increment: 1 } },
      });
    });
  });
});
