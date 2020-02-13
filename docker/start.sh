#!/bin/sh

# Stop operation
./stop.sh

# Build Docker images
cd crawler
docker build --pull --tag courseplanner-crawler .
cd ..

cd preprocess
docker build --pull --tag courseplanner-preprocess .
cd ..

# Start containers
# Crawler
docker run \
    --cpus 1 \
    --detach \
    --init \
    --memory 128m \
    --mount src=courseplanner-data,dst="/mnt/client/data" \
    --mount type=bind,src="$PWD/../crawler",dst="/mnt/crawler-src",ro \
    --mount type=bind,src="$PWD/crawler/crawler.sh",dst="/mnt/crawler.sh",ro \
    --name courseplanner-crawler \
    --restart unless-stopped \
    -w "/mnt" \
    courseplanner-crawler \
    bash /mnt/crawler.sh

# Preprocess
docker run \
    --cpus 1 \
    --detach \
    --init \
    --memory 128m \
    --mount src=courseplanner-code,dst="/mnt/client" \
    --mount src=courseplanner-jsdoc,dst="/mnt/jsdocs" \
    --mount type=bind,src="$PWD/../client",dst="/mnt/client-src",ro \
    --mount type=bind,src="$PWD/../jsdoc.json",dst="/mnt/jsdoc.json",ro \
    --mount type=bind,src="$PWD/preprocess/preprocess.sh",dst="/mnt/preprocess.sh",ro \
    --name courseplanner-preprocess \
    --restart no \
    -w "/mnt" \
    courseplanner-preprocess \
    bash /mnt/preprocess.sh

# Httpd
docker run \
    --cpus 0.1 \
    --detach \
    --init \
    --memory 16m \
    --mount src=courseplanner-code,dst="/mnt/client",ro \
    --mount src=courseplanner-data,dst="/mnt/client/data",ro \
    --mount src=courseplanner-jsdoc,dst="/mnt/jsdocs",ro \
    --mount type=bind,src="$PWD/httpd/httpd.conf",dst="/etc/httpd.conf",ro \
    --mount type=bind,src="$PWD/httpd/httpd.sh",dst="/mnt/httpd.sh",ro \
    --mount type=bind,src="$PWD/httpd/redirect.html",dst="/mnt/redirect.html",ro \
    --name courseplanner-httpd \
    --publish 80:80/tcp \
    --restart unless-stopped \
    -w "/mnt" \
    busybox \
    sh /mnt/httpd.sh
