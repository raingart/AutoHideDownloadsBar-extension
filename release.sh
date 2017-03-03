#!/bin/sh

# chmod a+x name.sh

FILENAME='chrome_bar'
# TODAY=$(date)

rm -v $FILENAME.zip
# zip -r chrome_bar.zip _locales\* css\* html\* icons\* images\* js\* lib\* LICENSE manifest.json
# zip -rf $FILENAME.zip \
zip -r $FILENAME.zip \
                  _locales \
                  css/skeleton/skeleton.min.css \
                  css/skeleton/normalize.min.css \
                  css/skeleton/normalize.min.css \
                  css/tooltip/tooltip-animation.css \
                  css/tooltip/tooltip-animation.min.css \
                  css/style.min.css \
                  html/settings.html \
                  icons \
                  js/bg.min.js \
                  js/settings.min.js \
                  lib/localization.min.js \
                  manifest.json \
# -z $TODAY
