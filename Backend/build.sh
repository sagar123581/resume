#!/usr/bin/env bash

pip install -r requirements.txt
python -m spacy download en_core_web_sm
python -m nltk.downloader stopwords