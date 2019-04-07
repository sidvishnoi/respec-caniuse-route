#!/usr/bin/env bash
mkdir -p data/caniuse
cd data
if [ -d "caniuse-raw" ]; then
  cd caniuse-raw
  git pull origin master
else
  git clone https://github.com/Fyrd/caniuse.git caniuse-raw
fi
