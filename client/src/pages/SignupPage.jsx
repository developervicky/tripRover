import React from "react";
import SignupComponent from "../components/SignupComponent";
import { Link } from "react-router-dom";

function SignupPage() {
  return (
    <div className="flex flex-col grow justify-center items-center gap-5 mb-36">
      <div className=" text-3xl font-bold">
        Welcome to <span className="text-primary">airbnb!</span>
      </div>
      <div className="text-3xl font-bold underline underline-offset-4 decoration-primary ">
        Signup
      </div>
      <form className="flex flex-col items-center">
        <input type="text" placeholder="Full Name" />
        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Password" />
        <button className="border-2  w-96 mx-auto px-4 py-3 font-semibold tracking-widest rounded-full my-3 hover:border-primary hover:bg-primary hover:text-white">
          Login
        </button>
      </form>
      <div>
        Already having a account! <Link to="/signin" className="tracking-wider underline underline-offset-4 decoration-primary hover:font-semibold hover:text-primary"> Signin</Link>
      </div>
    </div>
  );
}

export default SignupPage;
