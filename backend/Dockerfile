FROM node:20-alpine

# Install openssl and libc6-compat for Prisma to work on Alpine
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Ensure the Prisma client is generated with the correct binaries
RUN npx prisma generate

EXPOSE 4000

CMD ["npm", "run", "dev"]
