FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Expose port
EXPOSE 3000

# Start Vite on port 3000 and bind to all hosts
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
