package main

import (
  "ring/util"
  //"github.com/ethereum/go-ethereum/crypto/bn256"
  //"golang.org/x/crypto/bn256"
  "github.com/asimshankar/bn256"
  "math/big"
  "fmt"
  "flag"
  "os"
  "log"
  "runtime"
  "runtime/pprof"
)

var cpuprofile = flag.String("cpuprofile", "", "write cpu profile `file`")
var memprofile = flag.String("memprofile", "", "write memory profile to `file`")

func main() {
  flag.Parse()
  if *cpuprofile != "" {
    f, err := os.Create(*cpuprofile)
    if err != nil {
        log.Fatal("could not create CPU profile: ", err)
    }
    if err := pprof.StartCPUProfile(f); err != nil {
        log.Fatal("could not start CPU profile: ", err)
    }
    defer pprof.StopCPUProfile()
  }

  m := "veritaserum"
  numPairs := 2
  pks := make([]*bn256.G1, numPairs)
  var sks *big.Int
  var idx int = 0
  for i := 0; i < numPairs; i++ {
    if i == idx {
      pks[i], sks = util.GenRandomKeyPair()
    } else {
      pks[i], _ = util.GenRandomKeyPair()
    }
  }
  for count := 0; count < 10; count++ {
    eArr, sArr := util.SignAOS(pks, sks, idx, m)
    //util.VerifyAOSParr(pks, eArr, sArr, m)
    isValid := util.VerifyAOS(pks, eArr[numPairs-1], sArr, m)
    fmt.Printf("%t\n", isValid)
  }

  if *memprofile != "" {
    f, err := os.Create(*memprofile)
    if err != nil {
        log.Fatal("could not create memory profile: ", err)
    }
    runtime.GC() // get up-to-date statistics
    if err := pprof.WriteHeapProfile(f); err != nil {
        log.Fatal("could not write memory profile: ", err)
    }
    f.Close()
  }
}
