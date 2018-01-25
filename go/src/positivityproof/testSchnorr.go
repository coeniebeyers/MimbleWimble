package main

import (
  "positivityproof/util"
  "github.com/ethereum/go-ethereum/crypto/bn256"
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
  sqrtb := new(big.Int).SetInt64(2)
  sqrtv := new(big.Int).SetInt64(-3)
  kb := util.CryptoRandBigInt()
  kv := util.CryptoRandBigInt()
  G := new(bn256.G1).ScalarBaseMult(new(big.Int).SetInt64(1))
  secret := util.CryptoRandBigInt()
  H := new(bn256.G1).ScalarMult(G, secret)

  for count := 0; count < 8; count++ {
    sb, sv, e, K, Cp, C := util.GenSignature(m, sqrtb, sqrtv, kb, kv, G, H)
    isValid := util.VerifySignature(m, sb, sv, e, K, Cp, C, G, H)
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
