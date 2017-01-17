FROM node:alpine
ENV app /web/
EXPOSE 5000
COPY package.json $app
RUN cd $app && export NODE_ENV=production && npm install yarn -g
WORKDIR $app
ADD . $app
RUN yarn
USER web
CMD ["yarn run server"]
