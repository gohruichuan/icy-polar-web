import WalletConnectProvider from "@walletconnect/web3-provider";
import { Alert, Button, Col, Row, Image, Input, Spin } from "antd";
import { LoadingOutlined } from '@ant-design/icons';
import "antd/dist/antd.css";
import React, { useCallback, useEffect, useState } from "react";
// import ReactJson from "react-json-view";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import Web3Modal from "web3modal";
import "./App.css";
import { Account, Contract } from "./components";
import { INFURA_ID, NETWORK, NETWORKS } from "./constants";
import { Transactor } from "./helpers";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { faTwitter, faDiscord } from '@fortawesome/free-brands-svg-icons';

import {
  useBalance,
  useContractLoader,
  useContractReader,
  useExchangePrice,
  useGasPrice,
  useOnBlock,
  useUserSigner,
} from "./hooks";
import ReCAPTCHA from "react-google-recaptcha";
var CryptoJS = require("crypto-js");
const crypto = require("crypto");
require('dotenv').config()
var jwt = require('jsonwebtoken');

const { ethers } = require("ethers");
/// 📡 What chain are your contracts deployed to?
const targetNetwork = NETWORKS.rinkeby; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)

// 😬 Sorry for all the console logging
const DEBUG = false;
const NETWORKCHECK = false;
const IS_PRESALE_BUY = false;
const IS_LAUNCH_BUY = false;
let PRICE = 0.06;
let MAX_MINT = 5;

// 🛰 providers
if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");
const scaffoldEthProvider = null && navigator.onLine ? new ethers.providers.StaticJsonRpcProvider("https://rpc.scaffoldeth.io:48544") : null;
const mainnetInfura = navigator.onLine ? new ethers.providers.StaticJsonRpcProvider("https://mainnet.infura.io/v3/" + INFURA_ID) : null;// ( ⚠️ Getting "failed to meet quorum" errors? Check your INFURA_I

// 🏠 Your local provider is usually pointed at your local blockchain
const localProviderUrl = targetNetwork.rpcUrl;
// as you deploy to other networks you can set REACT_APP_PROVIDER=https://dai.poa.network in packages/react-app/.env
const localProviderUrlFromEnv = process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : localProviderUrl;
if (DEBUG) console.log("🏠 Connecting to provider:", localProviderUrlFromEnv);
const localProvider = new ethers.providers.StaticJsonRpcProvider(localProviderUrlFromEnv);

// 🔭 block explorer URL
const blockExplorer = targetNetwork.blockExplorer;

/*
  Web3 modal helps us "connect" external wallets:
*/
const web3Modal = new Web3Modal({
  // network: "mainnet", // optional
  cacheProvider: true, // optional
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider, // required
      options: {
        infuraId: INFURA_ID,
      },
    },
  },
});

const logoutOfWeb3Modal = async () => {
  await web3Modal.clearCachedProvider();
  setTimeout(() => {
    window.location.reload();
  }, 1);
};

function App(props) {
  const mainnetProvider = scaffoldEthProvider && scaffoldEthProvider._network ? scaffoldEthProvider : mainnetInfura;
  const [injectedProvider, setInjectedProvider] = useState();
  const [address, setAddress] = useState();
  /* 💵 This hook will get the price of ETH from 🦄 Uniswap: */
  // const price = useExchangePrice(targetNetwork, mainnetProvider);

  /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice(targetNetwork, "average");
  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userSigner = useUserSigner(injectedProvider, localProvider);
  useEffect(() => {
    async function getAddress() {
      if (web3Modal.cachedProvider && userSigner) {
        const newAddress = await userSigner.getAddress();
        console.warn("newAddress ", newAddress);
        setAddress(newAddress);
      }
    }
    // if(!address){
    getAddress();
    // }
  }, [userSigner]);

  // You can warn the user if you would like them to be on a specific network
  const localChainId = localProvider && localProvider._network && localProvider._network.chainId;
  const selectedChainId =
    userSigner && userSigner.provider && userSigner.provider._network && userSigner.provider._network.chainId;

  // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks

  // The transactor wraps transactions and provides notificiations
  const tx = Transactor(userSigner, gasPrice);

  // Faucet Tx can be used to send funds from the faucet
  // const faucetTx = Transactor(localProvider, gasPrice);

  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
  // const yourLocalBalance = useBalance(localProvider, address);

  // // Just plug in different 🛰 providers to get your balance on different chains:
  // const yourMainnetBalance = useBalance(mainnetProvider, address);

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider);
  // If you want to make 🔐 write transactions to your contracts, use the userSigner:
  const writeContracts = useContractLoader(userSigner, { chainId: localChainId });

  // EXTERNAL CONTRACT EXAMPLE:
  //
  // If you want to bring in the mainnet DAI contract it would look like:
  // const mainnetContracts = useContractLoader(mainnetProvider);

  // If you want to call a function on a new block
  // useOnBlock(mainnetProvider, () => {
  //   console.log(`⛓ A new mainnet block is here: ${mainnetProvider._lastBlockNumber}`);
  // });

  // Then read your DAI balance like:
  // const myMainnetDAIBalance = useContractReader(mainnetContracts, "DAI", "balanceOf", [
  //   "0x34aA3F359A9D614239015126635CE7732c18fDF3",
  // ]);

  // keep track of a variable from the contract in the local React state:
  // const balance = useContractReader(readContracts, "IcyPolar", "balanceOf", [address]);
  // console.log("🤗 balance:", balance);


  // // 📟 Listen for broadcast events
  // const transferEvents = useEventListener(readContracts, "IcyPolar", "Transfer", localProvider, 1);
  // console.log("📟 Transfer events:", transferEvents);

  //
  // 🧠 This effect will update yourCollectibles by polling when your balance changes
  //
  // const yourBalance = balance && balance.toNumber && balance.toNumber();
  // console.log("🤗 yourBalance:", yourBalance);

  // const totalSupplyBigNum = useContractReader(readContracts, "IcyPolar", "totalSupply");
  // console.log("CALLED INFURA");
  // const totalSupply = totalSupplyBigNum && totalSupplyBigNum.toNumber();


  // const contract = new web3.eth.Contract(contractInfo.ABI, contractInfo.contract_address);

  // console.warn("contract ", contract);
  //
  // 🧫 DEBUG 👨🏻‍🔬
  //
  // useEffect(() => {
  //   if (
  //     DEBUG 
  //     // &&
  //     // mainnetProvider &&
  //     // address &&
  //     // selectedChainId &&
  //     // yourLocalBalance &&
  //     // yourMainnetBalance &&
  //     // readContracts &&
  //     // writeContracts &&
  //     // mainnetContracts
  //   ) {
  //     console.log("_____________________________________ 🏗 scaffold-eth _____________________________________");
  //     // console.log("🌎 mainnetProvider", mainnetProvider);
  //     // console.log("🏠 localChainId", localChainId);
  //     // console.log("👩‍💼 selected address:", address);
  //     // console.log("🕵🏻‍♂️ selectedChainId:", selectedChainId);
  //     // console.log("💵 yourLocalBalance", yourLocalBalance ? ethers.utils.formatEther(yourLocalBalance) : "...");
  //     // console.log("💵 yourMainnetBalance", yourMainnetBalance ? ethers.utils.formatEther(yourMainnetBalance) : "...");
  //     // console.log("📝 readContracts", readContracts);

  //     // console.log("🌍 DAI contract on mainnet:", mainnetContracts);
  //     // console.log("💵 yourMainnetDAIBalance", myMainnetDAIBalance);
  //     // console.log("🔐 writeContracts", writeContracts);
  //   }
  // }, [
  //   // mainnetProvider,
  //   // address,
  //   // selectedChainId,
  //   // yourLocalBalance,
  //   // yourMainnetBalance,
  //   readContracts,
  //   // writeContracts,
  //   // mainnetContracts,
  // ]);

  // const totalSupply = new Promise((resolve, reject) => {
  //    readContracts && readContracts.IcyPolar && readContracts.IcyPolar.totalSupply().then(result => result.toNumber());
  // });

  //  let totalSupply = readContracts && readContracts.IcyPolar && readContracts.IcyPolar.totalSupply().then(function(result) {
  //   return result && result.toNumber();
  //  });


  // totalSupply && totalSupply.then( res => {return res});

  const loadWeb3Modal = useCallback(async () => {
    const provider = await web3Modal.connect();
    setInjectedProvider(new ethers.providers.Web3Provider(provider));

    provider.on("chainChanged", chainId => {
      console.log(`chain changed to ${chainId}! updating providers`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    provider.on("accountsChanged", () => {
      console.log(`account changed!`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    // Subscribe to session disconnection
    provider.on("disconnect", (code, reason) => {
      console.log(code, reason);
      logoutOfWeb3Modal();
    });
  }, [setInjectedProvider]);

  useEffect(() => {
    // console.warn("web3Modal.cachedProvider ", web3Modal.cachedProvider);
    if (web3Modal.cachedProvider && (IS_PRESALE_BUY || IS_LAUNCH_BUY)) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);


  const genToken = () => {
    var token = jwt.sign({
      data: crypto.randomBytes(9).toString("base64"),
      iat: (new Date().getTime()) / 1000,
      exp: (new Date().getTime() + 5 * 1000) / 1000,
    }, process.env.REACT_APP_API_SECRET_KEY);
    return token;
  }
  const validateWhitelist = async (address, tokenQuantity) => {
    const requestUrl = "https://api-dome-nft-whitelist.herokuapp.com/check/whitelist/" + address + "/" + tokenQuantity;
    // const requestUrl = "http://localhost:4000/check/whitelist/" + address + "/" + tokenQuantity;
    const getData = await fetch(requestUrl, {
      method: "GET",
      headers: {
        'Authorization': 'Bearer ' + genToken()
      }
    });
    let data = await getData.json();
    return data;
  }

  const successfulMint = async (address, tokenQuantity) => {
    const requestUrl = "https://api-dome-nft-whitelist.herokuapp.com/successful/mint/" + address + "/" + tokenQuantity;
    // const requestUrl = "http://localhost:4000/successful/mint/" + address + "/" + tokenQuantity;
    const getData = await fetch(requestUrl, {
      method: "GET",
      headers: {
        'Authorization': 'Bearer ' + genToken()
      }
    });
    let data = await getData.json();
    return data;
  }

  const failMint = async (address) => {
    const requestUrl = "https://api-dome-nft-whitelist.herokuapp.com/fail/mint/" + address;
    // const requestUrl = "http://localhost:4000/fail/mint/" + address;
    const getData = await fetch(requestUrl, {
      method: "GET",
      headers: {
        'Authorization': 'Bearer ' + genToken()
      }
    })
    let data = await getData.json();
    return data;
  }

  let [whitelistMessage, setWhitelistMessage] = useState();

  let [tokenQuantity, setTokenQuantity] = useState(1);

  let [isCaptchaVerified, setCaptchaVerified] = useState(false);

  let [totalSupply, setTotalSupply] = useState();

  let [isLoading, setIsLoading] = useState(false);

  let spinnerDiplay = "";

  if (isLoading) {
    const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;
    spinnerDiplay = (
      <h5>
        <Spin indicator={antIcon} /> <span style={{ color: "white" }}>MINT</span>
      </h5>
    )
  } else {
    spinnerDiplay = (
      <h5>
        <span style={{ color: "white" }}>MINT</span>
      </h5>
    )
  }
  // let [isCaptchaVerified, setCaptchaVerified] = useState(false); // default tokenQuantity


  (IS_PRESALE_BUY || IS_LAUNCH_BUY) && !totalSupply && readContracts && readContracts.IcyPolar && readContracts.IcyPolar.totalSupply().then(result => setTotalSupply(result.toNumber()));

  function refreshTotalSupply() {
    (IS_PRESALE_BUY || IS_LAUNCH_BUY) && readContracts && readContracts.IcyPolar && readContracts.IcyPolar.totalSupply().then(result => setTotalSupply(result.toNumber()));
  }

  function onChange(value) {
    console.log("Captcha value:", value);
    if (value) {
      setCaptchaVerified(true);
    }
  }


  let mintDisplay = "";
  if (!IS_LAUNCH_BUY && !IS_PRESALE_BUY) {
    mintDisplay = (
      <span>
        <h1 style={{ marginTop: 50, fontSize: "3rem" }}> Minting Coming Soon...</h1>
        <a href="https://discord.gg/H5SvcdehF3"><h1>Get whitelisted for our presale <FontAwesomeIcon icon={faExternalLinkAlt} /></h1></a>
        <h2 style={{ fontSize: "2rem" }}>Presale Mint Price: 0.04<span className="ether">Ξ</span> each</h2>
        <h2 style={{ fontSize: "2rem" }}>Launch Mint Price: 0.06<span className="ether">Ξ</span> each</h2>
      </span>
    )
  } else {

    if (IS_PRESALE_BUY) {
      MAX_MINT = 2;
      PRICE = 0.04;
    }

    mintDisplay = (
      <div style={{ margin: "auto", marginTop: 32, paddingBottom: 32 }} className="mint" >
        <h1 style={{ fontSize: "5rem", margin: 0 }}> {totalSupply} / 10,000 </h1>
        <h1 style={{ margin: 0 }}>Philodendomes Minted</h1>
        <br></br>
        <h2>Philodendome {PRICE} ETH Each</h2>
        <Image className="scalable-image" preview={false} src={require('./minus.png')} onClick={_ => {
          console.warn("minus!");
          let min = 0;
          let max = 0;

          if (IS_PRESALE_BUY) {
            min = 1;
            max = 2;
          } else {
            min = 1;
            max = 5;
          }

          let _tempQuantity = tokenQuantity - 1;
          let value = Math.max(Number(min), Math.min(Number(max), Number(_tempQuantity)));
          console.warn("value ", value);
          setTokenQuantity(value);
        }} />
        <Input placeholder="Quantity" maxLength={3} defaultValue={tokenQuantity} value={tokenQuantity} className="inputMint" onChange={event => {

          let min;
          let max;
          let value = event.target.value;
          if (IS_PRESALE_BUY) {
            min = 1;
            max = 2;
          } else {
            min = 1;
            max = 5;
          }

          value = Math.max(Number(min), Math.min(Number(max), Number(value)));
          setTokenQuantity(value)
        }} />
        <Image className="scalable-image" preview={false} src={require('./plus.png')} onClick={_ => {
          console.warn("plus!");
          let min = 0;
          let max = 0;

          if (IS_PRESALE_BUY) {
            min = 1;
            max = 2;
          } else {
            min = 1;
            max = 5;
          }
          let _tempQuantity = tokenQuantity + 1;
          let value = Math.max(Number(min), Math.min(Number(max), Number(_tempQuantity)));
          console.warn("value ", value);
          setTokenQuantity(value);
        }} />
        {IS_PRESALE_BUY ? (
          <h3>
            <span>Max {MAX_MINT} mints per Whitelisted Wallet Address</span>
          </h3>
        ) : (
          <h3>
            <span>Max {MAX_MINT} mints per transaction</span>
          </h3>
        )}
        {/* <br></br>
        <h2>
          <span >Total {(tokenQuantity * PRICE).toFixed(4)} ETH</span>
        </h2> */}

        <ReCAPTCHA style={{ textAlign: "-webkit-center" }}
          sitekey="6LeqU6QdAAAAALJi2OFNbsf1pS8Q9nArkJ03Mm7A"
          onChange={onChange}
        />
        <br></br>
        <Button disabled={!isCaptchaVerified || isLoading} className="mintBtn" size="large"
          onClick={() => {
            if (tokenQuantity === 0) {
              setWhitelistMessage(
                <div style={{ color: "red" }}>
                  Quantity is 0
                </div>
              );
              return;
            }
            if (!address && (IS_PRESALE_BUY || IS_LAUNCH_BUY)) {
              loadWeb3Modal();
            } else {
              if (!IS_PRESALE_BUY && IS_LAUNCH_BUY) { // Launch
                setIsLoading(true);
                let etherPrice = (tokenQuantity * PRICE);
                console.warn("LAUNCH MINTING!");
                console.warn("tokenQuantity ! ", tokenQuantity);
                console.warn("etherPrice ! ", etherPrice);

                etherPrice = Math.round(etherPrice * 1e4) / 1e4;
                tx(writeContracts.IcyPolar.buy(tokenQuantity, { value: ethers.utils.parseEther(etherPrice.toString()) }),
                  update => {
                    setIsLoading(false);
                    if (update.status === "confirmed" || update.status === 1) {
                      refreshTotalSupply();
                      setWhitelistMessage(
                        <div style={{ color: "green" }}>
                          Successfully minted {tokenQuantity} tokens!
                        </div>
                      );
                    } else if (update && (update.status !== "confirmed" && update.status !== 1 && update.status !== "sent" && update.status !== "pending")) {
                      console.warn("📡 TX FAILED");
                      setWhitelistMessage(
                        <div style={{ color: "red" }}>
                          Failed to mint {tokenQuantity} tokens!
                        </div>
                      );
                    }
                  });
              } else if (IS_PRESALE_BUY && !IS_LAUNCH_BUY) { // PRESALE
                setIsLoading(true);
                const getValidateWhitelist = async () => {
                  await validateWhitelist(address, tokenQuantity).then(res => {
                    if (res.result === "Whitelisted") {
                      let etherPrice = (tokenQuantity * PRICE);
                      console.warn("PRESALE MINTING!");
                      console.warn("tokenQuantity ! ", tokenQuantity);
                      console.warn("etherPrice ! ", etherPrice);

                      etherPrice = Math.round(etherPrice * 1e4) / 1e4;

                      var bytes = CryptoJS.AES.decrypt(res.ciphertext, process.env.REACT_APP_CRYPTO_SECRET_KEY);
                      var decrypted = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

                      tx(writeContracts.IcyPolar.presaleBuy(decrypted.signature, decrypted.nonce, decrypted.tokenQuantity, { value: ethers.utils.parseEther(etherPrice.toString()) }),
                        update => {
                          setIsLoading(false);

                          console.warn("📡 Transaction Update:", update);
                          if (update && (update.status !== "confirmed" && update.status !== 1 && update.status !== "sent" && update.status !== "pending")) {
                            console.warn("📡 TX FAILED");
                            failMint(address)
                          } else if (update.status === "confirmed" || update.status === 1) {
                            refreshTotalSupply();
                            // const balance = useContractReader(readContracts, "IcyPolar", "balanceOf", [address]);
                            // const yourBalance = balance && balance.toNumber && balance.toNumber();
                            // console.warn("yourBalance ", yourBalance);
                            // for (let tokenIndex = 0; tokenIndex < balance; tokenIndex++) {
                            //   const tokenId = readContracts.IcyPolar.tokenOfOwnerByIndex(address, tokenIndex);
                            //   console.warn("tokenId ", tokenId);
                            // }
                            successfulMint(address, decrypted.tokenQuantity).then(res => {
                              setWhitelistMessage(
                                <div style={{ color: "green" }}>
                                  Successfully minted {decrypted.tokenQuantity} tokens!
                                </div>
                              );
                            });
                          }
                        });
                    }
                    else if (res.result === "pending") {
                      setWhitelistMessage(
                        <div>
                          Please wait while we proccess your mint!
                        </div>
                      );
                    }
                    else if (res.result === "Mint exceed limit") {
                      setIsLoading(false);
                      setWhitelistMessage(
                        <div style={{ color: "red" }}>
                          You have exceed the presale mint limit of 2
                        </div>
                      );
                    }
                    else if (res.result === "Not Whitelisted") {
                      setIsLoading(false);
                      setWhitelistMessage(
                        <div style={{ color: "red" }}>
                          Sorry! You are Not whitelisted!
                        </div>
                      );
                    }
                    else {
                      setIsLoading(false);
                      setWhitelistMessage(
                        <div style={{ color: "red" }}>
                          Failed to mint {tokenQuantity} tokens!
                        </div>
                      );
                    }
                  });
                }
                getValidateWhitelist();
              }
            }
          }}
        >
          {spinnerDiplay}
        </Button>
        {whitelistMessage}
      </div>
    )
  }
  return (
    <div className="App">
      {/* ✏️ Edit the header and change the title to your project name */}
      {/* <Header /> */}
      <BrowserRouter>
        <Switch>
          <Route exact path="/">
            <div id="fullpage-wrapper">
              <div className="section1" id="home">
                <Row type="flex" justify="center" align="middle">
                  <Col>
                    <h1 className="title">
                     ICY POLAR
                    </h1>
                  </Col>
                </Row>
              </div>
              <span id="about"></span>
              <div className="section">
                <Row justify="center">
                  <Col>
                    <h1 style={{ fontSize: "5rem", textAlign: "center" }}>
                      Van Gogh's<br></br>Expressionism
                    </h1>
                  </Col>
                </Row>
                <Row justify="center">
                  <Col lg={7} xs={14}>
                    <p className="verticalAlignText">
                      Van Gogh's Expressionism is about the
                      struggles of being an artist. Van Gogh
                      himself was torn by mental
                      illness, emotions, passion, and distress.
                    </p>
                  </Col>
                </Row>
              </div>

              <span id="collection"></span>
              <div className="section">
                <Row justify="center">
                  <Col>
                    <h1 style={{ fontSize: "5rem", textAlign: "center" }}>
                      Collection
                    </h1>
                  </Col>
                </Row>
                <Row justify="center">
                  <Col lg={7} xs={14}>
                    <p className="verticalAlignText">
                      Van Gogh's Expressionism artwork
                      collection is a depiction of mental
                      illnesses in colors and its severity,

                      Degen Van Gogh hopes to spread the awareness
                      of mental illnesses and always to
                      treat people with kindness
                    </p>
                  </Col>
                </Row>
              </div>

              <span id="mint"></span>
              <div className="section">
                <Row justify="center">
                  <Col>
                    <h1 style={{ fontSize: "5rem", textAlign: "center" }}>
                      Mint
                    </h1>
                  </Col>
                </Row>
                <Row justify="center">
                  <Col>
                    {mintDisplay}
                  </Col>
                </Row>
              </div>
            </div>

            <span id="sneak"></span>
            <div className="section">
              <Row justify="center">
                <Col>
                  <h1 style={{ fontSize: "5rem", textAlign: "center" }}>
                    Sneak Peeks
                  </h1>
                </Col>
              </Row>
              <Row justify="center">
                <Col lg={7} xs={14}>
                  <p className="verticalAlignText">
                    Studies have shown that creative arts can be used as a form of therapy to cope
                    and convert these experiences into artistic expressions
                  </p>
                </Col>
              </Row>
            </div>

            <div className="section">
              <Row justify="center">
                <Col>
                  <h1 style={{ fontSize: "5rem", textAlign: "center" }}>
                    Schizophrenia
                  </h1>
                </Col>
              </Row>
              <Row justify="center">
                <Col lg={7} xs={14}>
                  <p className="verticalAlignText">
                    Schizophrenics preferred green less but
                    brown more
                  </p>
                </Col>
              </Row>
            </div>
            <div className="section">
              <Row justify="center">
                <Col>
                  {/* <Image className="sneakpeek" preview={false} src={require('./Schizophrenia.jpg')} /> */}
                </Col>
              </Row>
            </div>


            <div className="section">
              <Row justify="center">
                <Col>
                  <h1 style={{ fontSize: "5rem", textAlign: "center" }}>
                    Depression
                  </h1>
                </Col>
              </Row>
              <Row justify="center">
                <Col lg={7} xs={14}>
                  <p className="verticalAlignText">
                    People with anxiety and depression are
                    most likely to use a shade of gray to
                    represent their mental state
                  </p>
                </Col>
              </Row>
            </div>
            <div className="section">
              <Row justify="center">
                <Col>
                  {/* <Image className="sneakpeek" preview={false} src={require('./depression.jpg')} /> */}
                </Col>
              </Row>
            </div>

            <div className="section">
              <Row justify="center">
                <Col>
                  <h1 style={{ fontSize: "5rem", textAlign: "center" }}>
                    Bi-Polar<br></br>Disorder
                  </h1>
                </Col>
              </Row>
              <Row justify="center">
                <Col lg={7} xs={14}>
                  <p className="verticalAlignText">
                    People with Bi-polar disorders experienced
                    changes one or more of their five primary
                    senses during a manic episode

                    Colors were brighter and more vibrant
                  </p>
                </Col>
              </Row>
            </div>
            <div className="section">
              <Row justify="center">
                <Col>
                  {/* <Image className="sneakpeek" preview={false} src={require('./bi.jpg')} /> */}
                </Col>
              </Row>
            </div>

            <div className="section">
              <Row justify="center">
                <Col>
                  <h1 style={{ fontSize: "5rem", textAlign: "center" }}>
                    Obsessive-
                    Compulsive<br></br>
                    Disorder
                  </h1>
                </Col>
              </Row>
              <Row justify="center">
                <Col lg={7} xs={14}>
                  <p className="verticalAlignText">
                    People with OCD feared red.
                    Red can have an association with blood,
                    violence, death, etc.
                  </p>
                </Col>
              </Row>
            </div>
            <div className="section">
              <Row justify="center">
                <Col>
                  {/* <Image className="sneakpeek" preview={false} src={require('./ocd.jpg')} /> */}
                </Col>
              </Row>
            </div>

            <div className="section">
              <Row justify="center">
                <Col>
                  <h1 style={{ fontSize: "5rem", textAlign: "center" }}>
                    Post-Traumatic<br></br>Stress Disorder
                  </h1>
                </Col>
              </Row>
              <Row justify="center">
                <Col lg={7} xs={14}>
                  <p className="verticalAlignText">
                    People with post-traumatic
                    stress disorder (PTSD) preferred the color green
                  </p>
                </Col>
              </Row>
            </div>
            <div className="section">
              <Row justify="center">
                <Col>
                  {/* <Image className="sneakpeek" preview={false} src={require('./ptsd.jpg')} /> */}
                </Col>
              </Row>
            </div>

            <div className="section">
              <Row justify="center">
                <Col>
                  <h1 style={{ fontSize: "5rem", textAlign: "center" }}>
                    Paranoia
                  </h1>
                </Col>
              </Row>
              <Row justify="center">
                <Col lg={7} xs={14}>
                  <p className="verticalAlignText">
                    Orange symbolizes paranoia and sudden fits of violence
                  </p>
                </Col>
              </Row>
            </div>
            <div className="section">
              <Row justify="center">
                <Col>
                  {/* <Image className="sneakpeek" preview={false} src={require('./paranoia.jpg')} /> */}
                </Col>
              </Row>
            </div>


            <span id="next"></span>
            <div className="section">
              <Row justify="center">
                <Col>
                  <h1 style={{ fontSize: "5rem", textAlign: "center" }}>
                    What's Next?
                  </h1>
                </Col>
              </Row>
              <Row justify="center">
                  <Col lg={7} xs={14}>
                    <p className="verticalAlignText">
                      Holder will be able to access a dashboard where they can submit their PFPs for me to integrate your minted Van Gogh artwork with your PFPs.<br></br><br></br>
                      NFTs will be airdropped to you as follow: <br></br><br></br>
                      1. PFP - Your minted artwork as background with your submitted PFP<br></br><br></br>
                      2. Twitter Banner - Your minted artwork in Twitter Banner size with or without your submitted PFP<br></br>
                    </p>
                    <br></br>
                  </Col>
                </Row>
              <Row justify="center">
                <Col>
                  <h2 style={{ fontSize: "3rem", textAlign: "center" }}>
                    PFP x Van Gogh Collection
                  </h2>
                </Col>
              </Row>
            </div>

            
            <div className="section">
              <Row>
              </Row>
            </div>
          </Route>

          {/* <Route path="/debugcontracts">
            <Contract
              name="VanGoghExpressionism"
              signer={userSigner}
              provider={localProvider}
              address={address}
              blockExplorer={blockExplorer}
            />
          </Route> */}
        </Switch>
      </BrowserRouter>

      {/* <ThemeSwitch /> */}

      {/* 👨‍💼 Your account is in the top right with a wallet at connect options */}
      <div style={{ position: "fixed", right: 0, top: 0, padding: "10px 0 0 0", backgroundColor: "rgba(0, 0, 0, 0.35)", width: "100vw" }}>
        <h1 style={{ marginLeft: 20, textAlign: "left" }} >
          <a href="#home" style={{ color: "white" }}>VAN GOGH</a>
          <Account
            address={address}
            IS_LAUNCH_BUY={IS_LAUNCH_BUY}
            // localProvider={localProvider}
            // userSigner={userSigner}
            mainnetProvider={mainnetProvider}
            // price={price}
            web3Modal={web3Modal}
            loadWeb3Modal={loadWeb3Modal}
            logoutOfWeb3Modal={logoutOfWeb3Modal}
            blockExplorer={blockExplorer}
          />
        </h1>
      </div>
    </div>
  );
}

export default App;
