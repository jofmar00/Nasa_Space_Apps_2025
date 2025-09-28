# Build
FROM node:24-alpine as build
RUN mkdir -p /app

WORKDIR /app
COPY package.json /app

RUN npm install
COPY . /app

RUN npm run build --production

# Desplegar 
FROM node:24-alpine
WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/main.js"]
