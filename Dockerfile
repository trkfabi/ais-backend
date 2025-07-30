FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
COPY . .
ENV PRISMA_SCHEMA=./prisma/schema.prisma

RUN npx prisma generate

# Dev (opcional)
FROM base AS development
RUN npm install -g ts-node nodemon
CMD ["npm", "run", "start:development"]

# Prod
FROM base AS production
RUN npm run build
RUN npx prisma generate
CMD ["node", "dist/app.js"]


# use it like this:
# docker build --target=development en local
# docker build --target=production en el VPS