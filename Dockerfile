FROM node
COPY . /app
WORKDIR /app
RUN npm install && cd node_modules/naihelper.js/ && npm run prepare
RUN npx tsc
CMD node js/main.js