#!/usr/bin/env bash
if [ -d "caniuse-data" ]; then
  cd caniuse-data
  git pull origin master
  cd ..
else
  git clone https://github.com/Fyrd/caniuse.git caniuse-data
fi
