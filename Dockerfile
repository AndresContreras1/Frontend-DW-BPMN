# Etapa 1: compilar la aplicación Angular
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx ng build --configuration production

# Etapa 2: servir los archivos estáticos con nginx
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/frontend-dw-bpmn/browser /usr/share/nginx/html
EXPOSE 80
