#!/usr/bin/env bash

if [ "${TEST_SUITE}" == "harvard" ]; then
  drush en harvard_courses -y && drush cc all
fi


if [ "${TEST_SUITE}" == "solr" ]; then
  # Download and install Apache solr
  wget https://archive.apache.org/dist/lucene/solr/3.6.2/apache-solr-3.6.2.zip
  unzip -o apache-solr-3.6.2.zip
  cd apache-solr-3.6.2/example/solr/conf

  # Copy the solr config files from the apache solr module
  yes | cp /home/travis/build/openscholar/openscholar/www/profiles/openscholar/modules/contrib/apachesolr/solr-conf/solr-3.x/* .

  # Copy the modified solrconfig.xml file to commit records every 20 seconds so items will show up in search sooner
  yes | cp /home/travis/build/openscholar/openscholar/www/profiles/openscholar/behat/solr/solrconfig.xml .
  cd ../../
  java -jar start.jar &
  sleep 10
  cd /home/travis/build/openscholar/openscholar
fi