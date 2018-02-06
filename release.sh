#!/bin/sh

# chmod a+x release.sh

FILENAME='chrome_bar'
# TODAY=$(date)

rm -v $FILENAME.zip
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
