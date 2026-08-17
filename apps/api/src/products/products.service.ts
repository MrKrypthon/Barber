import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Product, ProductMovement } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { CreateProductMovementDto } from "./dto/create-product-movement.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

export type ProductResponse = {
  id: string;
  name: string;
  stock: number;
  minStock: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductMovementResponse = {
  id: string;
  type: ProductMovement["type"];
  quantity: number;
  description: string | null;
  createdAt: Date;
};

function toProductResponse(product: Product): ProductResponse {
  return {
    id: product.id,
    name: product.name,
    stock: product.stock,
    minStock: product.minStock,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

function toProductMovementResponse(movement: ProductMovement): ProductMovementResponse {
  return {
    id: movement.id,
    type: movement.type,
    quantity: movement.quantity,
    description: movement.description,
    createdAt: movement.createdAt,
  };
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string): Promise<ProductResponse[]> {
    const products = await this.prisma.product.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: "asc" },
    });
    return products.map(toProductResponse);
  }

  async create(tenantId: string, dto: CreateProductDto): Promise<ProductResponse> {
    const product = await this.prisma.product.create({
      data: {
        tenantId,
        name: dto.name,
        stock: dto.stock ?? 0,
        minStock: dto.minStock,
      },
    });
    return toProductResponse(product);
  }

  // El stock no se toca acá aunque el DTO lo permita por herencia de
  // CreateProductDto — solo cambia vía registerMovement, para que siempre
  // quede un movimiento que explique el cambio.
  async update(tenantId: string, id: string, dto: UpdateProductDto): Promise<ProductResponse> {
    await this.findOwned(tenantId, id);
    const product = await this.prisma.product.update({
      where: { id },
      data: { name: dto.name, minStock: dto.minStock },
    });
    return toProductResponse(product);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.findOwned(tenantId, id);
    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findMovements(tenantId: string, productId: string): Promise<ProductMovementResponse[]> {
    await this.findOwned(tenantId, productId);
    const movements = await this.prisma.productMovement.findMany({
      where: { tenantId, productId },
      orderBy: { createdAt: "desc" },
    });
    return movements.map(toProductMovementResponse);
  }

  // Entrada/salida manual de stock (docs/ROADMAP.md v0.3, Inventario): no
  // hay vínculo automático con Ventas ni Servicios todavía, así que el
  // stock solo se mueve por acá. Se actualiza en la misma transacción que
  // crea el movimiento para que "stock actual" y "suma de movimientos"
  // nunca queden desincronizados.
  async registerMovement(
    tenantId: string,
    productId: string,
    dto: CreateProductMovementDto,
  ): Promise<ProductMovementResponse> {
    const product = await this.findOwned(tenantId, productId);

    const delta = dto.type === "entry" ? dto.quantity : -dto.quantity;
    if (product.stock + delta < 0) {
      throw new BadRequestException("No hay suficiente stock para esa salida");
    }

    const [, movement] = await this.prisma.$transaction([
      this.prisma.product.update({
        where: { id: productId },
        data: { stock: { increment: delta } },
      }),
      this.prisma.productMovement.create({
        data: {
          tenantId,
          productId,
          type: dto.type,
          quantity: dto.quantity,
          description: dto.description,
        },
      }),
    ]);

    return toProductMovementResponse(movement);
  }

  // Nunca se confía en un id sin verificar que pertenece al tenant del
  // request; evita que un tenant acceda o modifique recursos de otro
  // (CLAUDE.md §5).
  private async findOwned(tenantId: string, id: string): Promise<Product> {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!product) {
      throw new NotFoundException("Producto no encontrado");
    }
    return product;
  }
}
