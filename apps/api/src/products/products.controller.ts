import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AuthenticatedUser } from "../auth/types/jwt-payload.type";
import { CreateProductDto } from "./dto/create-product.dto";
import { CreateProductMovementDto } from "./dto/create-product-movement.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ProductsService } from "./products.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.productsService.findAll(user.tenantId);
  }

  @Roles(Role.owner)
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateProductDto) {
    return this.productsService.create(user.tenantId, dto);
  }

  @Roles(Role.owner)
  @Put(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(user.tenantId, id, dto);
  }

  @Roles(Role.owner)
  @Delete(":id")
  async remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    await this.productsService.remove(user.tenantId, id);
    return { success: true };
  }

  @Get(":id/movements")
  findMovements(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.productsService.findMovements(user.tenantId, id);
  }

  // Owner y Employee pueden registrar movimientos, igual que en Caja
  // (docs/API.md — "el empleado registra gastos").
  @Post(":id/movements")
  registerMovement(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: CreateProductMovementDto,
  ) {
    return this.productsService.registerMovement(user.tenantId, id, dto);
  }
}
