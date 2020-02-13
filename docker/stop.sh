#!/bin/bash

# Stop and remove running containers
docker stop courseplanner-crawler
docker stop courseplanner-preprocess
docker stop courseplanner-httpd

docker rm courseplanner-crawler
docker rm courseplanner-preprocess
docker rm courseplanner-httpd

# Clear volume
docker volume rm courseplanner-code
docker volume rm courseplanner-data
docker volume rm courseplanner-jsdoc

docker volume create courseplanner-code
docker volume create courseplanner-data
docker volume create courseplanner-jsdoc
