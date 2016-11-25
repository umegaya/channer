#!/bin/sh

echo "keytool -genkey -v -keystore $1 -storepass $ANDROID_STOREPASS -alias $2 -keypass $ANDROID_KEYPASS -dname $ANDROID_CERT_DNAME -keyalg rsa -validity 10000"

keytool -genkey -v -keystore $1 -storepass $ANDROID_STOREPASS -alias $2 -keypass $ANDROID_KEYPASS -dname $ANDROID_CERT_DNAME -keyalg rsa -validity 10000

