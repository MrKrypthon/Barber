import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  // El logo del negocio se sube como data URI (base64) en el body JSON
  // (ADR-008, docs/DECISIONS.md) — el límite default de body-parser (100kb)
  // no alcanza para eso, aunque el cliente ya redimensiona la imagen.
  // `useBodyParser` existe en tiempo de ejecución (firma pública de
  // NestApplication: type, options — no confundir con la firma interna del
  // adaptador Express) pero @nestjs/common@10.4.x no lo tipa en
  // INestApplication todavía, de ahí el cast.
  (app as unknown as { useBodyParser: (type: string, opts: object) => void }).useBodyParser("json", {
    limit: "2mb",
  });

  // En producción, Nginx es el único proceso que habla directo con el
  // proceso de Node (docs/DEPLOYMENT.md) — sin esto, Express ve la IP de
  // Nginx en cada request en vez de la del cliente real, y el rate
  // limiting de /auth/login (auth.controller.ts) terminaría agrupando a
  // TODOS los usuarios en un solo balde. "1" = confiar solo en el primer
  // salto (el propio Nginx), no en cualquier proxy intermedio.
  (app as unknown as { set: (key: string, value: unknown) => void }).set("trust proxy", 1);

  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // enableCors() sin opciones usa el default del paquete `cors`, que refleja
  // dinámicamente cualquier Origin del request (Access-Control-Allow-Origin
  // = el origin recibido) — demasiado permisivo para una API que maneja JWT.
  // CORS_ORIGIN es una lista separada por comas de orígenes permitidos; en
  // desarrollo, si no se define, cae a la URL default del frontend local.
  const corsOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({ origin: corsOrigins });

  const port = process.env.API_PORT ?? 3001;
  await app.listen(port);
}

bootstrap();
