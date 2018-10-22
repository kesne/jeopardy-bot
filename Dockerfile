FROM node:10

# Install system dependencies:
RUN apt-get -y update; apt-get -y upgrade
RUN apt-get -y install libcairo2-dev libjpeg-dev libpango1.0-dev libgif-dev build-essential g++

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Install fonts:
COPY assets/fonts/*.ttf /usr/share/fonts/truetype/
RUN fc-cache -f -v /app/assets/fonts/

# Bundle app source
COPY . .

RUN npm run build

EXPOSE 8080
ENV PORT 8080
ENV SLACK_TOKEN $SLACK_TOKEN
CMD [ "node", "lib/index.js" ]
