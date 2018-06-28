# api

FROM node:10.2.1

ENV TZ=Etc/UTC

WORKDIR /api

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN npm install -g nodemon
