#!/usr/bin/env bash
if [ -d "caniuse-data" ]; then
  cd caniuse-data
  git pull origin master --depth 1
  cd ..
else
  git clone --depth 1 https://github.com/Fyrd/caniuse.git caniuse-data
fi
