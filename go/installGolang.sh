#!/usr/bin/env bash
wget https://storage.googleapis.com/golang/go1.7.linux-amd64.tar.gz
tar -xf go1.7.linux-amd64.tar.gz
sudo cp -r go/ /usr/local/
rm -rf go/ go1.7.linux-amd64.tar.gz
echo "export GOROOT=/usr/local/go" >> ~/.bashrc
echo "export GOPATH=$HOME/projects/go" >> ~/.bashrc
echo "PATH=\$PATH:/usr/local/go/bin" >> ~/.bashrc
source ~/.bashrc
