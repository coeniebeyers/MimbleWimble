#!/bin/bash

export GOPATH=`pwd`
`go get -u golang.org/x/crypto/bn256`
`go get -u github.com/ethereum/go-ethereum/crypto/sha3`
