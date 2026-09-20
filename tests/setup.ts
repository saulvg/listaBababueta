import { config } from "dotenv";

// Vitest no carga los ficheros de entorno de Next.js por su cuenta.
config({ path: [".env.local", ".env"] });
