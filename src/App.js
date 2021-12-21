import './App.css';
import 'react-toastify/dist/ReactToastify.css';

import { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';

const App = () => {
    const [fileTargets, setFileTargets] = useState(null);
    const [twitchChannelId, setTwitchChannelId] = useState("");
    const [proxyRunning, setProxyRunning] = useState(false);

    useEffect(() => {
        (async() => {
            let config = await window.api.send("getConfig");
            setFileTargets(config.fileTargets);
            setTwitchChannelId(config.twitchChannelId);
        })();
    }, []);

    const updateConfig = (field, value) => {
        let newTargets = {...fileTargets};
        newTargets[field].path = value;
        setFileTargets(newTargets);
    };

    const save = async () => {
        let config = {
            twitchChannelId,
            fileTargets
        }
        await window.api.send("updateConfig", config);
    }

    const startProxy = async () => {
        await window.api.send("startProxy");
        setProxyRunning(true);
    }

    const stopProxy = async () => {
        await window.api.send("stopProxy");
        setProxyRunning(false);
    }

    if (!fileTargets) {
        return null;
    }

    return (
        <div style={{textAlign: "center"}}>
            <ToastContainer />
            <h1>Streamcrabs Proxy</h1>
            <div>
                <table>
                    <tbody>
                        <tr>
                            <td>Twitch Channel Id:</td>
                            <td><input type='text' value={twitchChannelId} onChange={({target: {value}}) => {setTwitchChannelId(value)}} disabled={proxyRunning} /></td>
                        </tr>
                        <tr>
                            <td>Current Game Path:</td>
                            <td><input type='text' value={fileTargets["CG"].path} onChange={({target: {value}}) => {updateConfig("CG", value)}} disabled={proxyRunning} /></td>
                        </tr>
                        <tr>
                            <td>Latest Follower Path:</td>
                            <td><input type='text' value={fileTargets["LATEST_FOLLOW"].path} onChange={({target: {value}}) => {updateConfig("LATEST_FOLLOW", value)}} disabled={proxyRunning} /></td>
                        </tr>
                        <tr>
                            <td>Latest Subscriber Path:</td>
                            <td><input type='text' value={fileTargets["LATEST_SUB"].path} onChange={({target: {value}}) => {updateConfig("LATEST_SUB", value)}} disabled={proxyRunning} /></td>
                        </tr>
                        <tr>
                            <td>Latest Cheer Path:</td>
                            <td><input type='text' value={fileTargets["LATEST_CHEER"].path} onChange={({target: {value}}) => {updateConfig("LATEST_CHEER", value)}} disabled={proxyRunning} /></td>
                        </tr>
                        <tr>
                            <td>Big Shot Path:</td>
                            <td><input type='text' value={fileTargets["BIG_SHOT"].path} onChange={({target: {value}}) => {updateConfig("BIG_SHOT", value)}} disabled={proxyRunning} /></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <button onClick={() => {save()}} disabled={proxyRunning}>Save</button><br />
            {!proxyRunning ? <button onClick={() => {startProxy()}}>Start Proxy</button> : <button onClick={() => {stopProxy()}}>Stop Proxy</button>}
        </div>
    );
}

export default App;
