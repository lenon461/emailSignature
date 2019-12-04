#!/bin/bash

rm -r css fonts js index.html statics
quasar build
mv dist/spa/* .
