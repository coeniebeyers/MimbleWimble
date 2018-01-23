pragma solidity ^0.4.19;
import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/EcOperations.sol";

contract TestEcOperations{
  function testEcAdd() public {
    EcOperations ec = new EcOperations();
    uint256 ax = 1;
    uint256 ay = 2;
    uint256 bx = 1;
    uint256 by = 2;
    uint256[2] memory actual = ec.ecadd(ax, ay, bx, by);
    uint256[2] memory expected;
    expected[0] = 1368015179489954701390400359078579693043519447331113978918064868415326638035; //x
    expected[1] = 9918110051302171585080402603319702774565515993150576347155970296011118125764; //y
    Assert.equal(expected[0], actual[0], "The answer should be a.x + b.x");
    Assert.equal(expected[1], actual[1], "The answer should be a.y + b.y");
  }
  function testEcMul() public {
    EcOperations ec = new EcOperations();
    uint256 original_x = 1;
    uint256 original_y = 2;
    uint256 scalar = 2;
    uint256[2] memory actual = ec.ecmul(original_x, original_y, scalar);
    uint256[2] memory expected;
    expected[0] = 1368015179489954701390400359078579693043519447331113978918064868415326638035; //x
    expected[1] = 9918110051302171585080402603319702774565515993150576347155970296011118125764; //y
    Assert.equal(expected[0], actual[0], "The point p.x should be multiplied by the scalar");
    Assert.equal(expected[1], actual[1], "The point p.y should be multiplied by the scalar");
  }
  // This works, but consumes 10899348 gas and breaks testrpc's defaults
  /*function testVerifyRingSigGasCosts() public {
    EcOperations ec = new EcOperations();
    uint256[2] memory actual = ec.verifyRingSigGasCosts();
    uint256[2] memory expected;
    expected[0] = 1368015179489954701390400359078579693043519447331113978918064868415326638035; //x
    expected[1] = 9918110051302171585080402603319702774565515993150576347155970296011118125764; //y
    Assert.equal(expected[0], actual[0], "The point p.x should be multiplied by the scalar");
    Assert.equal(expected[1], actual[1], "The point p.y should be multiplied by the scalar");
  }*/
}
