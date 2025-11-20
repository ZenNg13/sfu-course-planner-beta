# --- Stage 1: The Builder ---
# We use a heavy Node image to build the app
FROM node:18-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy configuration files first (better caching)
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including 'devDependencies' like typescript)
RUN npm install

# Generate the Prisma Client (so the app understands the DB)
RUN npx prisma generate

# Copy the rest of your source code
COPY . .

# Build the app (converts TypeScript -> JavaScript in /dist)
RUN npm run build

# --- Stage 2: The Runner ---
# We use a fresh, lightweight image for production
FROM node:18-alpine AS runner

WORKDIR /app

# Set to production mode (optimizes Express)
ENV NODE_ENV=production

# Copy package files again
COPY package*.json ./
COPY prisma ./prisma/

# Install ONLY production dependencies (skips typescript, etc. to save space)
RUN npm ci --only=production

# Generate Prisma Client again for this stage
RUN npx prisma generate

# Copy the compiled code from the 'builder' stage
COPY --from=builder /app/dist ./dist
# Copy the public folder (for your frontend)
COPY --from=builder /app/public ./public

# Open the door for traffic
EXPOSE 3000

# The command to start the server
CMD ["npm", "start"]