#!/bin/bash

# Copy files from readonly folder to readwrite folder
cp -r client-src/* client

# Generate JSDoc
jsdoc --private --configure jsdoc.json

# Simplify JavaScript and HTML. CSS is not processed.
# This step overrites files in readwrite filder with simplified version
cd client-src
for fileName in $(find . -type f -name "*.js" -or -name "*.html"); do
    minify ${fileName} > ../client/${fileName}
done
cd ..
