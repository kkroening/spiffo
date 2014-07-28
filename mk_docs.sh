#!/bin/bash

#rm -rf doc && lib/jsdoc/jsdoc -t lib/jaguarjs-jsdoc -d doc js/main.js js/views.js
rm -rf doc && lib/jsdoc/jsdoc -t lib/docstrap/template -d doc -c jsdoc_conf.json js/main.js js/views.js
