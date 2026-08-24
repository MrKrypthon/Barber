import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Imagen de producción mínima (docker/web/Dockerfile.prod, docs/DEPLOYMENT.md):
  // standalone empaqueta solo lo que el server necesita para correr, sin
  // arrastrar node_modules completo a la imagen final.
  output: "standalone",
  // Monorepo: sin esto, el file tracing de Next solo mira apps/web y no ve
  // los paquetes hermanos (@barber/types, @barber/api-client) de los que
  // depende — quedarían afuera de .next/standalone y el server fallaría al
  // arrancar en el contenedor.
  outputFileTracingRoot: path.join(__dirname, "../.."),
};

export default nextConfig;
