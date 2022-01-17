#!/bin/bash

podman build -t quay.io/alexocc/mybankfrontend .
podman push quay.io/alexocc/mybankfrontend
oc delete pod -l app=mobile-simulator -n bank-infra
