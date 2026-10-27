import mongoose from 'mongoose';

export const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://mongodb:27017/control_horario';

  let retries = 5;
  while (retries > 0) {
    try {
      console.log(`[MongoDB] Intentando conectar a ${mongoURI}...`);
      const conn = await mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`[MongoDB] Conectado exitosamente en: ${conn.connection.host}`);
      return;
    } catch (error) {
      retries -= 1;
      console.error(`[MongoDB Error] Fallo al conectar: ${error.message}. Reintentos restantes: ${retries}`);
      if (retries === 0) {
        console.error('[MongoDB Error] No se pudo conectar a MongoDB. Saliendo...');
        process.exit(1);
      }
      // Esperar 3 segundos antes del siguiente intento
      await new Promise((res) => setTimeout(res, 3000));
    }
  }
};
