import { Controller, Get } from "@nestjs/common";

// Sin guard a propósito: endpoint de liveness/monitoreo (Nginx, orquestador,
// etc.), no de negocio, y no expone nada sensible — solo un status fijo.
@Controller("health")
export class HealthController {
  @Get()
  check() {
    return { status: "ok" };
  }
}
