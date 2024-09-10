# Stage 1: Build Stage
FROM node:20 AS build

RUN apt-get update -y

# Set working directory
WORKDIR /app

# Using pnpm and dotenv-cli ts-node
RUN npm install -g npm
RUN npm install -g pnpm

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN pnpm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 5173

# Command to run the application
CMD ["pnpm", "run", "dev", "--", "--host"]
