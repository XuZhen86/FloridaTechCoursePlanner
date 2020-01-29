#!/bin/bash

# Stop and remove running containers
docker stop courseplanner-crawler
docker stop courseplanner-httpd
docker rm   courseplanner-crawler
docker rm   courseplanner-httpd

# Clear volume
docker volume rm     courseplanner-data
docker volume create courseplanner-data
