import React, { useState } from "react";
import "./App.css";
import Auth from "./pages/Auth";
import ChatPage from "./pages/ChatPage";

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    return (
        <div>
            {isLoggedIn ? (
                <ChatPage />
            ) : (
                <Auth onLogin={setIsLoggedIn} />
            )}
        </div>
    );
}

export default App;