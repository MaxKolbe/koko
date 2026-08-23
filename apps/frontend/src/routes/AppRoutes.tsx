import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home/Home";
import Notfound from "../pages/Not Found/Notfound";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/*" element={<Notfound />} />
    </Routes>
  );
};

export default AppRoutes;
