# Usa Node 20
FROM node:20

# Directorio de trabajo en el contenedor
WORKDIR /app

# Copia dependencias y las instala
COPY package*.json ./
RUN npm install

# Copia todo el código fuente (incluye prisma/schema.prisma)
COPY . .

# Genera Prisma Client dentro del contenedor
RUN npx prisma generate

# Expone el puerto de la API
EXPOSE 3000

# Comando para iniciar en desarrollo
CMD ["npm", "run", "start:development"]