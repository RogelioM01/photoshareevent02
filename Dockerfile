# Utiliza una imagen base de Node.js
FROM node:18-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./

# Instalar todas las dependencias
RUN npm install

# Copiar el código fuente
COPY . .

# Compilar el frontend y el backend
RUN npm run build

# Segunda etapa: Producir una imagen más ligera solo con lo necesario para correr la app
FROM node:18-alpine
WORKDIR /app

# Copiar solo las dependencias de producción del package.json
COPY package.json package-lock.json ./
RUN npm install --omit=dev

# Copiar los archivos compilados de la etapa de construcción
COPY --from=build /app/dist ./dist
COPY --from=build /app/server/index.js ./server/index.js

# Exponer el puerto que tu servidor Express escuchará
EXPOSE 5000

# Comando de inicio
CMD ["node", "server/index.js"]