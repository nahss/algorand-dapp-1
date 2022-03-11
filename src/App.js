import React, {useState} from "react";
import Cover from "./components/Cover";
import Counter from "./components/Counter";
import QRCodeModal from "algorand-walletconnect-qrcode-modal";
import './App.css';
import Wallet from "./components/wallet";
import WalletConnect from "@walletconnect/client";
import { apiGetAccountAssets } from "./utils/dapp";
const App = function AppWrapper() {

    const [connector, setConnector] = useState(null);
    const [address, setAddress] = useState(null);

    const [assets, setAssets] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [chain, setChain] = useState([]);

    const [fetching, setFetching] = useState(false);
    const [connected, setConnected] = useState(false);
    const walletConnectInit = async () => {
        // bridge url
        const bridge = "https://bridge.walletconnect.org";

        // create new connector
        const connector = new WalletConnect({bridge, qrcodeModal: QRCodeModal});

        await setConnector({connector});

        // check if already connected
        if (!connector.connected) {
            console.log("creating session")
            // create new session
            await connector.createSession();
        }

        console.log("session created")

        // subscribe to events
        await subscribeToEvents();
    };
    const subscribeToEvents = () => {
        console.log("subscribing to events")
        if (!connector) {
            console.log("no connector")
            return;
        }
        console.log({connected, connector})

        connector.on("session_update", async (error, payload) => {
            console.log(`connector.on("session_update")`);

            if (error) {
                throw error;
            }

            const {accounts} = payload.params[0];
            onSessionUpdate(accounts);
        });

        connector.on("connect", (error, payload) => {
            console.log(`connector.on("connect")`);

            if (error) {
                throw error;
            }

            onConnect(payload);
        });

        connector.on("disconnect", (error, payload) => {
            console.log(`connector.on("disconnect")`);

            if (error) {
                throw error;
            }

            onDisconnect();
        });

        if (connector.connected) {
            const {accounts} = connector;
            const address = accounts[0];
            setConnected(true)
            setAccounts(accounts)
            setAddress(address)
            onSessionUpdate(accounts);
        }
        setConnector(connector)
    };

    const killSession = async () => {
        if (connector) {
            connector.killSession();
        }
        resetApp();
    };

    const chainUpdate = (newChain) => {

        setChain(newChain)
        getAccountAssets()
    };

    const resetApp = async () => {

        setConnector(null)
        setAddress(null)
        setAssets(null)
        setAccounts(null)
        setChain(null)
        setFetching(null)
        setConnected(null)
    };

    const onConnect = async (payload) => {
        console.log("connected!!!")
        const {accounts} = payload.params[0];
        const address = accounts[0];
        console.log({address})

        setConnected(true)
        setAccounts(accounts)
        setAddress(address)
        getAccountAssets();
    };

    const onDisconnect = async () => {
        resetApp();
    };

    const onSessionUpdate = async (accounts) => {
        const address = accounts[0];
        setAddress(address)
        setAccounts(accounts)
        await getAccountAssets();

    };

    const getAccountAssets = async () => {

        setFetching(true)
        try {
            // get account balances
            const assets = await apiGetAccountAssets(chain, address);

            setAddress(address)
            setAssets(assets)

        } catch (error) {
            console.error(error);

        } finally {
            setFetching(false)
        }
    };
    //
    // public toggleModal = () =>
    //     this.setState({
    //         showModal: !this.state.showModal,
    //         pendingSubmissions: [],
    //     });


    return (
        <div className="App">
            <header className="App-header">
                {address ?
                    <Wallet address={address} amount={0} destroy={killSession} symbol={"ALGO"}/>
                    :
                    <Cover connect={walletConnectInit}/>
                }

            </header>
        </div>
    );
}

export default App;
