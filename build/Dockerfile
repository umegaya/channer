FROM ubuntu:15.04

RUN apt-get update
RUN apt-get install -y runit

RUN mkdir -p /etc/ssl/certs
COPY ca-certificates.crt /etc/ssl/certs/
