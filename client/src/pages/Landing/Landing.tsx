import Login from "./Components/Login/Login";
import { useNavigate } from "react-router-dom";

function Landing() {
    const navigate = useNavigate();
    return (
        <div className="text-white min-h-svh max-h-svh flex items-center justify-center">
            <Login onAuthenticated={(token) => navigate("/upload", { state: { token } })} />
        </div>
    );
}
export default Landing;
