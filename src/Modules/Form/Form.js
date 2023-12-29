import React, { useState } from "react";
import Input from "../../Components/Input/Input.js";
import Button from "../../Components/Button/Button.js";
import { useNavigate } from "react-router-dom";

const Form = ({ isLogInPage = false }) => {
  const [data, setData] = useState({
    ...(!isLogInPage && {
      fullName: "",
    }),
    email: "",
    password: "",
  });
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("data :>> ", data);
    const res = await fetch(
      `http://localhost:8000/api/${isLogInPage ? "login" : "register"}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );
    if (res.status === 400) {
      alert("Invalid Credentials");
    } else {
      const resData = await res.json();
      console.log("data :>> ", resData);
      if (resData.token) {
        localStorage.setItem("user:token", resData.token);
        localStorage.setItem("user:detail",JSON.stringify(resData.user));
        navigate("/");
      }
    }
  };
  return (
    <div className="bg-light h-screen flex items-center justify-center">
      <div className="bg-white w-[500px] h-[600px] shadow-lg rounded-lg flex flex-col justify-center items-center">
        <div className="text-2xl font-extrabold mb-10">
          {isLogInPage ? "Login" : "Register"}
        </div>
        <form
          className="flex flex-col items-center w-full"
          onSubmit={handleSubmit}
        >
          {!isLogInPage && (
            <Input
              label="Full Name"
              name="name"
              placeholder="Enter your Full Name"
              className="mb-6 w-[75%]"
              value={data.fullName}
              onChange={(e) => setData({ ...data, fullName: e.target.value })}
            />
          )}
          <Input
            label="Email Address"
            name="email"
            placeholder="Enter your Email Address"
            className="mb-6 w-[75%]"
            value={data.email}
            onChange={(e) => setData({ ...data, email: e.target.value })}
          />
          <Input
            label="Password"
            name="password"
            placeholder="Enter your Password"
            className="mb-10 w-[75%]"
            value={data.password}
            onChange={(e) => setData({ ...data, password: e.target.value })}
          />
          <Button
            label={isLogInPage ? "Login" : "Register"}
            className="w-[75%] mb-2"
            type="submit"
          />
        </form>
        <div>
          {isLogInPage ? "Don't Have an Account?" : "Already Have an Account?"}{" "}
          <span
            className="text-primary cursor-pointer underline"
            onClick={() => navigate(`/${isLogInPage ? "register" : "login"}`)}
          >
            {isLogInPage ? "Register" : "Login"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Form;
