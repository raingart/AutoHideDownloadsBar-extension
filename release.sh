#!/bin/sh

# chmod a+x name.sh

FILENAME='chrome_bar'
# TODAY=$(date)

rm -v $FILENAME.zip
# zip -r chrome_bar.zip _locales\* css\* html\* icons\* images\* js\* lib\* LICENSE manifest.json
# zip -rf $FILENAME.zip \
zip -r $FILENAME.zip \
                  _locales \
                  css/*/*.css \
                  css/*.css \
                  html/*.html \
                  icons/16.png \
                  icons/48.png \
                  icons/128.png \
                  js/*.js \
                  lib/*.min.js \
                  manifest.json \
# -z $TODAY
