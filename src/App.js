import './App.css';
import 'react-toastify/dist/ReactToastify.css';

import { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';

const fileTargetMap = {
    CG: "Current Game File:",
    LATEST_FOLLOW: "Latest Follow File:",
    LATEST_SUB: "Latest Subscriber File:",
    LATEST_CHEER: "Latest Cheer File:",
    BIG_SHOT: "Big Shot File:"
}

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

    const openDialog = async (field) => {
        let filePath = await window.api.send("openDialog");

        if (filePath) {
            updateConfig(field, filePath);
            save();
        }
    }

    const validate = () => {
        return !twitchChannelId;
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
                            <td colSpan={2}><input style={{width: "100%"}} type='text' value={twitchChannelId} onChange={({target: {value}}) => {setTwitchChannelId(value)}} onBlur={save} disabled={proxyRunning} /></td>
                        </tr>
                        { Object.keys(fileTargets).map((key) => {
                            const fileTarget = fileTargets[key];
                            return (
                                <tr key={key}>
                                    <td>{fileTargetMap[key]}</td>
                                    <td><button onClick={() => {openDialog(key)}} disabled={proxyRunning}>Browse</button></td>
                                    <td style={{textAlign: "left", verticalAlign: "middle"}}>{fileTarget.path ? fileTarget.path : "None"}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {!proxyRunning ? <button onClick={() => {startProxy()}} disabled={validate()}>Start Proxy</button> : <button onClick={() => {stopProxy()}}>Stop Proxy</button>}
        </div>
    );
}

export default App;
