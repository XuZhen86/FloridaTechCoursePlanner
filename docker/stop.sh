#!/bin/bash

# Stop and remove running containers
docker stop courseplanner-crawler
docker stop courseplanner-preprocess
docker stop courseplanner-httpd
docker rm courseplanner-crawler
docker rm courseplanner-preprocess
docker rm courseplanner-httpd

# Remove volumes
docker volume rm courseplanner-code
docker volume rm courseplanner-data
docker volume rm courseplanner-jsdoc
