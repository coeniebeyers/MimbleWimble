pragma solidity ^0.4.19;

contract EcOperations{
  function ecadd(uint256 ax, uint256 ay, uint256 bx, uint256 by) public payable returns(uint256[2] p) {
    uint256[4] memory input;
    input[0] = ax;
    input[1] = ay;
    input[2] = bx;
    input[3] = by;
    assembly {
      if iszero(call(not(0), 0x06, 0, input, 0x80, p, 0x40)) {
        revert(0, 0)
      }
    }
  } 
  function ecmul(uint256 x, uint256 y, uint256 scalar) public payable returns(uint256[2] p) {
    uint256[3] memory input;
    input[0] = x;
    input[1] = y;
    input[2] = scalar;
    assembly {
      // call ecmul precompile
      if iszero(call(not(0), 0x07, 0, input, 0x60, p, 0x40)) {
        revert(0, 0)
      }
    }
  } 

  // upper bound gas cost ~= (2 x ecmul + 1 x ecsub + 1 x sha3 ) x digits x base
  // for 64 bits: 256 x ecmul + 128 ecsub + 128 sha3
  function verifyRingSigGasCosts() public payable returns(uint256[2] p) {
    uint256[4] memory input;
    input[0] = 1;
    input[1] = 2;
    input[2] = 2;
    assembly {
      let n := 256
      let i := 0
      loop:
        jumpi(end, eq(i, n))
        if iszero(call(not(0), 0x07, 0, input, 0x60, p, 0x40)){
          revert(0, 0) 
        }
        i := add(i, 1)
        jump(loop)
      end:
    }
    input[2] = 1;
    input[3] = 2;
    assembly {
      let n := 128
      let i := 0
      loop:
        jumpi(end, eq(i, n))
        if iszero(call(not(0), 0x06, 0, input, 0x80, p, 0x40)){
          revert(0, 0) 
        }
        i := add(i, 1)
        jump(loop)
      end:
    }
    assembly {
      let n := 128
      let i := 0
      loop:
        jumpi(end, eq(i, n))
        if iszero(keccak256(1368015179489954701390400359078579693043519447331113978918064868415326638035, 1)){}
        i := add(i, 1)
        jump(loop)
      end:
    }
  } 
}
