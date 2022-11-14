# ABIGEN Extended

Based on the contract ABI, **abigen** create some Go code to interact with our smart contract functions
in a pleasant way (automatic type binding, parsing logs, etc…).

But this is not enough to having a full control on our Smart Contract, indeed some features are missing:
- Make Static Call on non-view functions
- Get the hash of events
- Getting the contract address on an instance
- Getting the ABI of an instance
- Extract Parsed event from logs receipt

That's why we have created this tool. Basically it use abigen under the hood and add some code at the bottom on the file.

## Installation

Install abigen: https://geth.ethereum.org/docs/install-and-build/installing-geth
```bash
# Install the package
npm install -g abigen-extended
# Or with yarn
yarn global add abigen-extended
```

## Usage

### Generate Go Binding

```bash
abigen-extended --abi <PATH_TO_ABI_FILE> --out <PATH_TO_GO_FILE> --pkg <GO_PACKAGE_NAME>
```
For the rest of the readme, I suppose we use the following command for importing WETH contract:
```bash
abigen-extended --abi weth.abi.json --out weth.go --pkg weth
```

### Access new fields on contract instance
```go
wethContract, err := weth.NewWeth(address, client)

wethContract.Address // Get the instance address
wethContract.Backend // Get the client instance
wethContract.ABI     // Get the parsed ABI
```

### Access hash of events
```go
weth.EVENT_APPROVAL_HASH // Hash of approval event
weth.EVENT_TRANSFER_HASH // Hash of transfer event
// ...
```

### Parse event from receipt
```go
events, err := wethContract.ParseReceiptTransfer(receipt) // Get all parsed transfer logs from the receipt
```

### Static call for non view function
```go
// Perform static call on transfer (non payable)
transferSuccess, err := wethContract.StaticTransfer(&bind.CallOpts{ From: address }, receiver, amount)

// Perform static call on deposit (payable)
err := wethContract.StaticDeposit(&bind.CallOpts{ From: address }, payableETHValue)
```
