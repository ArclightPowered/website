import './App.css';
import DownloadPage from "./Downloads";
import Footer from "./Footer";
import {Adsense} from '@ctrl/react-adsense';

function App() {
    return (
        <div className="App">
            <DownloadPage/>
            <Adsense
                client="ca-pub-7578867677289048"
                slot="6662016159"
            />
            <Footer />
        </div>
    );
}

export default App;
