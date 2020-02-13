#!/bin/bash

# Copy crawler scripts from readonly folder to read-write folder
mkdir /mnt/crawler
cp -r /mnt/crawler-src/* /mnt/crawler

# Schedule crawler to execute hourly
echo "0 * * * * cd /mnt && /mnt/crawler/crawl.sh" | crontab

# Run crawler for the first time
/mnt/crawler/crawl.sh

# Start Crontab in foreground
exec /usr/sbin/cron -f
