#!/bin/bash

# Copy crawler scripts from readonly folder to read-write folder
mkdir crawler
cp -r crawler-src/* crawler

# Schedule crawler to execute hourly
echo "0 * * * * cd /mnt && /mnt/crawler/crawl.sh" | crontab

# Run crawler for the first time
crawler/crawl.sh

# Start Crontab in foreground
exec /usr/sbin/cron -f
