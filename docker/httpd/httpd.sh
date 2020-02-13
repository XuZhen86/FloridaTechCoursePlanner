#!/bin/sh

# Delay httpd until data file shows up
while [ ! -f /mnt/client/data/scheduleMeta.json ]; do
    sleep 5
done

# Start httpd in foreground
exec /bin/busybox httpd -fvvc /etc/httpd.conf
