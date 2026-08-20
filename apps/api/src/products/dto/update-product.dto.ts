import { PartialType } from "@nestjs/mapped-types";
import { CreateProductDto } from "./create-product.dto";

// El stock nunca se edita directo acá (a diferencia de name/minStock) — solo
// cambia a través de movimientos, para que siempre quede un porqué
// registrado (ver ProductsService.update, que ignora dto.stock si llega).
export class UpdateProductDto extends PartialType(CreateProductDto) {}
