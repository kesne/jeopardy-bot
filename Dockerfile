FROM node:10-alpine

# Install system dependencies:
RUN apk add --no-cache \
    build-base \
    g++ \
    python \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    bash \
    imagemagick

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package.json ./
COPY yarn.lock ./
RUN yarn

# Bundle app source
COPY . .

RUN yarn run build

EXPOSE 8080
ENV PORT 8080
ENV SLACK_TOKEN $SLACK_TOKEN
CMD [ "node", "lib/index.js" ]
