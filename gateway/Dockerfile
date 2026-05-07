FROM nginx:alpine
RUN rm /etc/nginx/conf.d/default.conf
COPY gateway/nginx.conf /etc/nginx/nginx.conf
COPY frontend/dist /usr/share/nginx/html
EXPOSE 80
