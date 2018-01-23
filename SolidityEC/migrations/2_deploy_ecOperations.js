var EcOperations = artifacts.require("./EcOperations.sol");

module.exports = function(deployer) {
  deployer.deploy(EcOperations);
};

