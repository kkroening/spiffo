#!/bin/bash

rm -rf doc && lib/jsdoc/jsdoc -t lib/jaguarjs-jsdoc -d doc js/main.js js/views.js
