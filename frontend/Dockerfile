# Build — VITE_API_URL phải là URL mà **trình duyệt** gọi được (public), ví dụ https://api.example.com
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY index.html vite.config.js postcss.config.js tailwind.config.js eslint.config.js ./
COPY public ./public
COPY src ./src

ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
