import logo from "./logo.svg";
import "./App.css";
import Form from "./Modules/Form/Form";
import Dashboard from "./Modules/Dashboard/Dashboard";
import { Routes, Route, Navigate } from "react-router-dom";

const ProtectedRoute = ({ children,auth=false }) => {
  const isLoggedIn = localStorage.getItem("user:token") !== null || false;
  if (!isLoggedIn && auth) {
    return <Navigate to="/login" />;
  } else if (
    isLoggedIn &&
    (["/login", "/register"].includes(window.location.pathname))
  ) {
    console.log("Object :>> ");
    return <Navigate to="/" />;
  }
  return children;
};

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute auth={true}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/login"
        element={
          <ProtectedRoute>
            <Form isLogInPage={true} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/register"
        element={
          <ProtectedRoute>
            <Form isLogInPage={false} />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
