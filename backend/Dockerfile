# Start from the official MongoDB image instead of Alpine
FROM mongo:latest

# Install Node.js, npm, and clean up temporary files
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

# Start MongoDB safely inside the container, wait 3 seconds, then start your backend
CMD mongod --fork --logpath /var/log/mongodb.log --dbpath /data/db && sleep 3 && npm start