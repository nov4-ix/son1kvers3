FROM node:20-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm@8.15.0 && \
    pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter @super-son1k/the-generator build

EXPOSE 5173

CMD ["pnpm", "--filter", "@super-son1k/the-generator", "preview", "--host"]