import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";
import ChatPage from "./pages/ChatPage";
import Dashboard from "./pages/Dashboard";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <Router>
      <Routes>
        {isLoggedIn ? (
          <>
            <Route path="/" element={<ChatPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </>
        ) : (
          <Route path="/" element={<Auth onLogin={setIsLoggedIn} />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;