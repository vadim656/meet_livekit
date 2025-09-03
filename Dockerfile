FROM node:20.19-slim AS builder

WORKDIR /app

# Копируем только файлы, необходимые для установки зависимостей
COPY package.json yarn.lock ./

# Устанавливаем зависимости
RUN yarn install --frozen-lockfile

# Копируем остальные файлы проекта
COPY . .

# Собираем проект
RUN yarn build

# Этап финального образа
FROM node:20.18-slim

WORKDIR /app

# Копируем только необходимые файлы из этапа сборки
COPY --from=builder /app/.output /app/.output

# Устанавливаем переменные окружения
ENV HOST=0.0.0.0
ENV NODE_ENV=production

# Открываем порт
EXPOSE 3000

# Запускаем приложение
ENTRYPOINT ["node", "/app/.output/server/index.mjs"]