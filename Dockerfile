FROM node:20

RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    make \
    g++ \
    git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app


COPY package*.json ./
RUN npm install --legacy-peer-deps \
    && npm install --save-dev \
        eslint-plugin-import \
        eslint-plugin-node \
        eslint-plugin-promise

COPY . .

RUN npx patch-package || echo "No patches to apply"

EXPOSE 8080
CMD [ "npm", "run", "dev" ]
