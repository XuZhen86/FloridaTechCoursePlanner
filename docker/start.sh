#!/bin/sh

# Stop operation
./stop.sh

# Build Docker images
cd crawler
docker build --pull --tag courseplanner-crawler .
cd ..

# Start containers
# Crawler
docker run \
    --cpus 0.5 \
    --detach \
    --init \
    --memory 512m \
    --mount src=courseplanner-data,dst="/mnt/client/data" \
    --mount type=bind,src="$PWD/../crawler",dst="/mnt/crawler" \
    --mount type=bind,src="$PWD/crawler/crawler.sh",dst="/mnt/crawler.sh",ro \
    --name courseplanner-crawler \
    --restart unless-stopped \
    -w "/mnt" \
    courseplanner-crawler \
    bash /mnt/crawler.sh
# Httpd
docker run \
    --cpus 0.5 \
    --detach \
    --init \
    --memory 128m \
    --mount src=courseplanner-data,dst="/mnt/client/data",ro \
    --mount type=bind,src="$PWD/../client",dst="/mnt/client",ro \
    --mount type=bind,src="$PWD/httpd/httpd.conf",dst="/etc/httpd.conf",ro \
    --mount type=bind,src="$PWD/httpd/httpd.sh",dst="/mnt/httpd.sh",ro \
    --mount type=bind,src="$PWD/httpd/redirect.html",dst="/mnt/redirect.html",ro \
    --name courseplanner-httpd \
    --publish 172.17.0.1:37240:80/tcp \
    --restart unless-stopped \
    -w "/mnt" \
    busybox \
    sh /mnt/httpd.sh
