import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Role, User } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { TenantsService } from "../tenants/tenants.service";
import { UsersService } from "../users/users.service";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  let authService: AuthService;
  let usersService: {
    findByEmail: jest.Mock;
    findById: jest.Mock;
    emailIsTaken: jest.Mock;
    create: jest.Mock;
    incrementTokenVersion: jest.Mock;
  };
  let tenantsService: { create: jest.Mock };
  let prisma: { $transaction: jest.Mock };
  let jwtService: { sign: jest.Mock; verifyAsync: jest.Mock };
  let config: { getOrThrow: jest.Mock };

  const baseUser: User = {
    id: "user-1",
    tenantId: "tenant-1",
    name: "Ada",
    email: "ada@example.com",
    password: "irrelevant-in-most-tests",
    role: Role.owner,
    tokenVersion: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      emailIsTaken: jest.fn(),
      create: jest.fn(),
      incrementTokenVersion: jest.fn(),
    };
    tenantsService = { create: jest.fn() };
    prisma = { $transaction: jest.fn((cb: (tx: unknown) => unknown) => cb({})) };
    jwtService = {
      sign: jest.fn().mockReturnValue("signed-token"),
      verifyAsync: jest.fn(),
    };
    config = { getOrThrow: jest.fn((key: string) => `test-${key}`) };

    authService = new AuthService(
      prisma as unknown as PrismaService,
      tenantsService as unknown as TenantsService,
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
      config as unknown as ConfigService,
    );
  });

  describe("register", () => {
    it("crea tenant + owner y devuelve tokens", async () => {
      usersService.emailIsTaken.mockResolvedValue(false);
      tenantsService.create.mockResolvedValue({ id: "tenant-1", name: "Mi Barbería" });
      usersService.create.mockResolvedValue(baseUser);

      const result = await authService.register({
        businessName: "Mi Barbería",
        ownerName: "Ada",
        email: "ada@example.com",
        password: "supersecret",
      });

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: "tenant-1", role: Role.owner }),
        expect.anything(),
      );
      expect(result.accessToken).toBe("signed-token");
      expect(result.refreshToken).toBe("signed-token");
      expect(result.user).toEqual(
        expect.objectContaining({ id: "user-1", email: "ada@example.com", role: Role.owner }),
      );
    });

    it("rechaza si el correo ya existe", async () => {
      usersService.emailIsTaken.mockResolvedValue(true);

      await expect(
        authService.register({
          businessName: "Mi Barbería",
          ownerName: "Ada",
          email: "ada@example.com",
          password: "supersecret",
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe("login", () => {
    it("rechaza correo inexistente", async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({ email: "nope@example.com", password: "whatever" }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("rechaza contraseña incorrecta", async () => {
      const hashed = await bcrypt.hash("correct-password", 4);
      usersService.findByEmail.mockResolvedValue({ ...baseUser, password: hashed });

      await expect(
        authService.login({ email: baseUser.email, password: "wrong-password" }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("acepta credenciales correctas y devuelve tokens", async () => {
      const hashed = await bcrypt.hash("correct-password", 4);
      usersService.findByEmail.mockResolvedValue({ ...baseUser, password: hashed });

      const result = await authService.login({
        email: baseUser.email,
        password: "correct-password",
      });

      expect(result.accessToken).toBe("signed-token");
      expect(result.user.email).toBe(baseUser.email);
    });
  });

  describe("refresh", () => {
    it("rechaza un token con firma/formato inválido", async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error("bad token"));

      await expect(authService.refresh({ refreshToken: "garbage" })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it("rechaza si el tokenVersion no coincide (revocado por logout)", async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: "user-1",
        tenantId: "tenant-1",
        tokenVersion: 0,
      });
      usersService.findById.mockResolvedValue({ ...baseUser, tokenVersion: 1 });

      await expect(authService.refresh({ refreshToken: "stale" })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it("emite nuevos tokens y rota tokenVersion (invalidando el refresh token usado)", async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: "user-1",
        tenantId: "tenant-1",
        tokenVersion: 0,
      });
      usersService.findById.mockResolvedValue(baseUser);
      usersService.incrementTokenVersion.mockResolvedValue({ ...baseUser, tokenVersion: 1 });

      const result = await authService.refresh({ refreshToken: "valid" });

      expect(usersService.incrementTokenVersion).toHaveBeenCalledWith("user-1");
      expect(result.accessToken).toBe("signed-token");
      expect(result.refreshToken).toBe("signed-token");
    });
  });

  describe("logout", () => {
    it("incrementa el tokenVersion del usuario", async () => {
      await authService.logout("user-1");
      expect(usersService.incrementTokenVersion).toHaveBeenCalledWith("user-1");
    });
  });
});
