// frontend/src/App.jsx - ADD STATISTICS ROUTE
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/loginPage.jsx";
import NewsPage from "./pages/newsPage.jsx";
import AdminPage from "./pages/adminPage.jsx";
import NewsDetailsPage from "./pages/newsDetailsPage.jsx";
import StatisticsPage from "./pages/statisticsPage.jsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/news/:id" element={<NewsDetailsPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/statistics" element={<StatisticsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
