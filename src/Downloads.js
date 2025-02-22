import React, {useState, useEffect} from 'react';
import semverCompare from "semver/functions/compare";

const InlineSelect = ({value, onChange, options, disabled}) => (
    <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="inline-select"
        style={{
            background: 'transparent',
            color: 'inherit',
            font: 'inherit',
            cursor: 'pointer',
            padding: '0 0.2em',
            margin: '0 0.1em',
            border: '1px solid rgba(0,0,0,0.2)',
            borderRadius: '4px',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
        }}
    >
        <optgroup
            label={"Select"}
            style={{
                fontSize: '0.5em',
                padding: '2px 4px',
            }}>
            {options.map(option => (
                <option
                    key={option.value}
                    value={option.value}
                    className="inline-option"
                >
                    {option.label}
                </option>
            ))}
        </optgroup>
    </select>
);

const DownloadPage = () => {
    const [minecraftVersions, setMinecraftVersions] = useState([]);
    const [selectedMC, setSelectedMC] = useState('');
    const [loaders, setLoaders] = useState([]);
    const [selectedLoader, setSelectedLoader] = useState('');
    const [versions, setVersions] = useState([]);
    const [loading, setLoading] = useState({
        mc: false, loaders: false, versions: false
    });
    const [error, setError] = useState('');
    const loaderMapping = new Map([['neoforge', 'NeoForge'], ['forge', 'Forge'], ['fabric', 'Fabric']]);

    // 获取所有Minecraft版本
    useEffect(() => {
        const fetchMCVersions = async () => {
            try {
                setLoading(prev => ({...prev, mc: true}));
                const res = await fetch('https://files.hypoglycemia.icu/v1/files/arclight/minecraft', {redirect: 'follow'});
                const data = await res.json();
                const mcVersions = data.files.map(f => f.name).sort(function (a, b) {
                    const aName = a.split(".").length < 3 ? a + ".0" : a;
                    const bName = b.split(".").length < 3 ? b + ".0" : b;
                    return semverCompare(bName, aName);
                });
                setMinecraftVersions(mcVersions);
            } catch (err) {
                setError('Error loading Minecraft versions');
            } finally {
                setLoading(prev => ({...prev, mc: false}));
            }
        };
        fetchMCVersions();
    }, []);

    // 获取分支和加载器
    useEffect(() => {
        if (!selectedMC) return;

        const fetchBranchAndLoaders = async () => {
            try {
                setLoading(prev => ({...prev, loaders: true}));
                // 获取加载器列表
                const loaderRes = await fetch(`https://files.hypoglycemia.icu/v1/files/arclight/minecraft/${selectedMC}/loaders`, {redirect: 'follow'});
                const loaderData = await loaderRes.json();
                setLoaders(loaderData.files.map(f => f.name));
            } catch (err) {
                setError('Error loading modloaders');
            } finally {
                setLoading(prev => ({...prev, loaders: false}));
            }
        };

        fetchBranchAndLoaders();
    }, [selectedMC]);

    // 获取版本数据（仅从snapshot获取）
    useEffect(() => {
        const fetchVersions = async () => {
            setVersions([]);
            if (!selectedLoader || !selectedMC) {
                return;
            }
            try {
                setLoading(prev => ({...prev, versions: true}));

                // 获取snapshot版本列表
                const res = await fetch(`https://files.hypoglycemia.icu/v1/files/arclight/minecraft/${selectedMC}/loaders/${selectedLoader}/versions-snapshot`, {redirect: 'follow'});
                const data = await res.json();

                // 处理版本数据
                const processedVersions = await Promise.all(data.files.map(async file => {
                    // 判断稳定版条件
                    const isStable = !file.name.includes('-SNAPSHOT');

                    return {
                        rawVersion: file.name,
                        displayVersion: file.name,
                        stable: isStable,
                        permlink: file?.permlink,
                        downloadLink: file?.link,
                        lastModified: new Date(file['last-modified']).toLocaleString()
                    };
                }));

                // 按最后修改时间排序（新版本在前）
                processedVersions.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

                setVersions(processedVersions);
            } catch (err) {
                setError('Error loading Arclight versions');
            } finally {
                setLoading(prev => ({...prev, versions: false}));
            }
        };

        fetchVersions();
    }, [selectedLoader, selectedMC]);

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    return (<div className="container">
        <h1 className="title">
            Download Arclight
            <InlineSelect
                value={selectedMC}
                onChange={(e) => {
                    setSelectedLoader('');
                    setSelectedMC(e.target.value);
                }}
                options={[
                    {value: '', label: '...'},
                    ...minecraftVersions.map(v => ({value: v, label: v}))
                ]}
                disabled={loading.mc}
            />
            on
            <InlineSelect
                value={selectedLoader}
                onChange={(e) => setSelectedLoader(e.target.value)}
                options={[
                    {value: '', label: '...'},
                    ...loaders.map(l => ({value: l, label: loaderMapping.get(l) || l}))
                ]}
                disabled={!selectedMC || loading.loaders}
            />
        </h1>

        {error && <div className="error">{error}</div>}

        {versions.length > 0 && (<div className="version-table">
            <table>
                <thead>
                <tr>
                    <th>Version</th>
                    <th></th>
                    <th>Date</th>
                    <th>Download</th>
                </tr>
                </thead>
                <tbody>
                {versions.map((v, i) => (<tr
                    key={i}
                    className={v.stable ? 'stable' : 'snapshot'}
                    title={v.rawVersion}
                >
                    <td>{v.displayVersion}</td>
                    <td>{v.stable ? '⚡' : ''}</td>
                    <td>{v.lastModified}</td>
                    <td>
                        <div className="action-buttons">
                            <button
                                onClick={() => window.open(v.downloadLink, '_blank')}
                                className="download-btn"
                            >
                                Download
                            </button>
                            <button
                                onClick={() => copyToClipboard(v.permlink)}
                                className="copy-btn"
                            >
                                Copy Link
                            </button>
                        </div>
                    </td>
                </tr>))}
                </tbody>
            </table>
        </div>)}

        <style jsx>{`
            .container {
                max-width: 1200px;
                margin: 2rem auto;
                padding: 1rem;
            }

            .selectors {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 2rem;
                margin: 2rem 0;
            }

            .select-group {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }

            select {
                padding: 0.8rem;
                font-size: 1rem;
                border: 2px solid #ccc;
                border-radius: 4px;
                background: white;
            }

            .version-table {
                margin-top: 2rem;
                overflow-x: auto;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                border-radius: 8px;
            }

            table {
                width: 100%;
                border-collapse: collapse;
                background: white;
            }

            th, td {
                padding: 1rem;
                text-align: left;
                border-bottom: 1px solid #eee;
            }

            th {
                background: #f8f9fa;
                font-weight: 600;
            }

            tr.stable {
                background: #f8fff9;
            }

            tr.snapshot {
                background: #fefefe;
            }

            .version-tag {
                display: inline-block;
                padding: 0.2rem 0.5rem;
                border-radius: 4px;
                font-size: 0.9em;
                background: ${v => v.stable ? '#4CAF50' : '#FF9800'};
                color: white;
            }

            .action-buttons {
                display: flex;
                gap: 0.5rem;
            }

            button {
                padding: 0.5rem 1rem;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                transition: all 0.2s;
            }

            .download-btn {
                background: #2196F3;
                color: white;
            }

            .copy-btn {
                background: #4CAF50;
                color: white;
            }

            button:hover {
                opacity: 0.9;
                transform: translateY(-1px);
            }

            .error {
                color: #dc3545;
                padding: 1rem;
                border: 1px solid #dc3545;
                border-radius: 4px;
                margin: 1rem 0;
                background: #fff5f5;
            }

            .inline-option {
                line-height: 1.4;
                padding: 6px 12px;
                background: white;
                color: #333;
            }
        `}</style>
    </div>);
};

export default DownloadPage;