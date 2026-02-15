import { useState } from "react";
import { Container, Form, Button } from "react-bootstrap";
import { userApi } from "../services/api/userApi";
import { useUser } from "../context/userContext"; // import your custom hook
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const [name, setName] = useState("");
  const navigate = useNavigate(); // ✅ get the navigate function
  const { setUsername } = useUser(); // get setter from context

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const user = await userApi.login(name); // await the async call
      setUsername(user.name); // store the username in context
      navigate("/news"); // redirect to news page
      console.log("Logged in user:", user);
    } catch (err) {
      console.error("Login failed:", err);
      alert("Login failed. Check console.");
    }
  };

  return (
    <Container
      className="d-flex justify-content-center align-items-center"
      style={{ height: "100vh" }} // full viewport height
    >
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <h3 className="mb-4 text-center">Login</h3>

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Username</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter username"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Form.Group>

          <Button type="submit" className="w-100">
            Login
          </Button>
        </Form>
      </div>
    </Container>
  );
}

export default LoginPage;
