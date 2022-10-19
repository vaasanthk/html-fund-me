import { ethers } from "./ethers-5.6.esm.min.js"
import { abi, contractAddress } from "./constants.js"

let currentAccount = null
let provider
let signer
let contract

const ethPrice = document.getElementById("ethPrice")

// updating buttons
const connectButton = document.getElementById("connectButton")
connectButton.onclick = connect

const fundButton = document.getElementById("fundButton")
fundButton.onclick = fund

const checkBalButton = document.getElementById("checkBalance")
checkBalButton.onclick = getBalance
const ethFunded = document.getElementById("accountBal")

const withdrawButton = document.getElementById("withdraw")
withdrawButton.onclick = withdraw
const withdrawText = document.getElementById("withdrawText")

const contractAddressText = document.getElementById("contractAddressText")
const inputEth = document.getElementById("ethFunded")

function handleAccountsChanged(accounts) {
  if (accounts.length === 0) {
    // MetaMask is locked or the user has not connected any accounts
    console.log("Please connect to MetaMask.")
  } else if (accounts[0] !== currentAccount) {
    currentAccount = accounts[0]
    // Do any other work!
    console.log(currentAccount)
    contractAddressText.innerHTML = currentAccount
    contractAddressText.style.color = "maroon"
  }
}

async function connect() {
  console.log("Connecting....")
  if (typeof window.ethereum !== "undefined") {
    await ethereum
      .request({ method: "eth_requestAccounts" })
      .then(handleAccountsChanged)
      .catch((err) => {
        if (err.code === 4001) {
          // EIP-1193 userRejectedRequest error
          // If this happens, the user rejected the connection request.
          console.log("Please connect to MetaMask.")
        } else {
          console.error(err)
        }
      })
    provider = new ethers.providers.Web3Provider(window.ethereum)
    signer = provider.getSigner()
    contract = new ethers.Contract(contractAddress, abi, signer)
    connectButton.innerHTML = "Connected!"
    const price = await contract.getPrice()
    ethPrice.innerHTML = "$" + ethers.utils.formatEther(price) + "  Eth Price!"
    connectButton.style.backgroundColor = "#b0bf1a"
  } else {
    connectButton.innerHTML = "Please install Metamask"
  }
}

async function fund() {
  const ethAmount = document.getElementById("ethAmount").value
  console.log(`Funding with ${ethAmount}....`)
  if (typeof window.ethereum !== "undefined") {
    try {
      const transactionResponse = await contract.fund({
        value: ethers.utils.parseEther(ethAmount),
      })
      await listenForTransactionMine(transactionResponse, provider)
      inputEth.innerHTML = ethAmount.toString() + " Eth was succesfully funded!"
    } catch (error) {
      console.log(error)
      inputEth.innerHTML = "Transaction failed."
    }
  } else {
    fundButton.innerHTML = "Please install Metamask"
  }
}

async function getBalance() {
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    try {
      const balance = await provider.getBalance(contractAddress)
      ethFunded.innerHTML = ethers.utils.formatEther(balance) + " ETH"
    } catch (error) {
      console.log(error)
    }
  } else {
    checkBalButton.innerHTML = "Please install Metamask."
  }
}

async function withdraw() {
  if (typeof window.ethereum !== "undefined") {
    try {
      const transactionResponse = await contract.withdraw()
      await listenForTransactionMine(transactionResponse, provider)
      withdrawText.innerHTML = "Withdrawal Successful"
    } catch (error) {
      console.log(error)
      inputEth.innerHTML = "Transaction failed."
    }
  } else {
    fundButton.innerHTML = "Please install Metamask"
  }
}

function listenForTransactionMine(transactionResponse, provider) {
  console.log(`Mining ${transactionResponse.hash}`)
  return new Promise((resolve, reject) => {
    try {
      provider.once(transactionResponse.hash, (transactionReceipt) => {
        console.log(
          `Completed with ${transactionReceipt.confirmations} confirmations.`
        )
        resolve()
      })
    } catch (error) {
      reject(error)
    }
  })
}
