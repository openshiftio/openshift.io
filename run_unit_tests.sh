#!/usr/bin/env bash

LOGFILE=$(pwd)/unit_tests.log
echo Using logfile $LOGFILE

# Running npm test
echo Running unit tests...
npm run test:unit | tee $LOGFILE ; UNIT_TEST_RESULT=${PIPESTATUS[0]}

if [ $UNIT_TEST_RESULT -eq 0 ]; then
  echo 'Unit tests OK'
  exit 0
else
  echo 'Unit tests FAIL'
  exit 1
fi
