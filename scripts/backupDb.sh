#/bin/bash

source scripts/variables.txt

DATE=$(date +"%Y-%m-%dT%H:%M")

mongodump --forceTableScan --uri=$DATABASE_URL
zip -r "dump-$DATE.zip" dump
mv dump-$DATE.zip db-backups
rm -rf dump/

echo "DONE"