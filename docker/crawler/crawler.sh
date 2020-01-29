#!/bin/bash

# Schedule crawler to execute hourly
echo "0 * * * * cd /mnt && /mnt/crawler/crawl.sh" | crontab

# Run crawler for the first time
/mnt/crawler/crawl.sh

# Start Crontab in foreground
exec /usr/sbin/cron -f
