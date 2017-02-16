@echo off
del chrome_bar.zip >nul
winrar a -afzip -m5 -r chrome_bar.zip \
                  _locales \
                  css \
                  html \
                  icons \
                  js \
                  lib \
                  manifest.json \
                  -xnode_modules
