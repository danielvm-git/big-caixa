# Livro-caixa — uma imagem: o site SvelteKit construído aqui, o Node serve site e API.
FROM node:24-slim AS build
WORKDIR /src
ARG GIT_SHA=unknown
ENV GITHUB_SHA=$GIT_SHA
COPY package.json package-lock.json .npmrc ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:24-slim
ENV NODE_ENV=production \
    PORT=3000 \
    CAIXA_DB=/data/caixa.db
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund && npm cache clean --force
COPY server/ server/
COPY db/ db/
COPY --from=build /src/build build/
RUN mkdir /data && chown node:node /data
# uid 1000 (usuário "node" da imagem), o mesmo dono de /srv/caixa no host.
USER node
VOLUME /data
EXPOSE 3000
CMD ["node", "server/index.mjs"]
