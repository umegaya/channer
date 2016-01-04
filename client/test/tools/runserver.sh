#!/bin/bash

pushd ../server
	killall channer
	make stopdb 
	make start
popd

