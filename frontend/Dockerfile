FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Accept VITE_API_URL as a build argument (passed by Render via Build Args)
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN echo "Building with VITE_API_URL=$VITE_API_URL" && npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK CMD wget -qO- http://127.0.0.1/ || exit 1
