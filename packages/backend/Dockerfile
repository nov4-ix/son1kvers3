FROM node:20-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

RUN npm install -g pnpm@8.15.0 && \
    pnpm install --frozen-lockfile

RUN npx prisma generate

COPY . .

RUN pnpm --filter @super-son1k/backend build

EXPOSE 3001

CMD ["pnpm", "--filter", "@super-son1k/backend", "start"]