FROM node:18

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

RUN yarn global add ts-node

COPY . .

EXPOSE 4000

CMD ["yarn", "dev"]