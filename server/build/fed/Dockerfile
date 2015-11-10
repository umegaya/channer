FROM 2channer/base

COPY fed /usr/local/bin
RUN mkdir -p /etc/channer/fed
COPY config.json /etc/channer/fed/config.json
ADD service /etc/service/fed

CMD ["runsvdir"]
