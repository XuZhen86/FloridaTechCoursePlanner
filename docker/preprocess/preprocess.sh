#!/bin/bash

echo "Preprocess started @" $(date)

# Copy files from readonly folder to readwrite folder
cp -r client-src/* client

# Generate JSDoc
jsdoc --verbose --private --configure jsdoc.json

# Simplify JavaScript, HTML, and CSS
# This step overrites files in readwrite filder with simplified version
cd client-src
for fileName in $(find . -type f -name "*.js" -or -name "*.html" -or -name "*.css"); do
    echo ${fileName}
    minify ${fileName} > ../client/${fileName}
done
cd ..

echo "Preprocess finished @" $(date)
echo
