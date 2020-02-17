#!/bin/bash

# Copy crawler scripts from readonly folder to read-write folder
mkdir crawler
cp -r crawler-src/* crawler

# Schedule crawler to execute hourly
# Redirect to stdout and stderr of root process
echo "0 * * * * cd /mnt && /mnt/crawler/crawl.sh 1>/proc/1/fd/1 2>/proc/1/fd/2" | crontab

# Run crawler for the first time
crawler/crawl.sh

# Start Crontab in foreground
exec /usr/sbin/cron -f
