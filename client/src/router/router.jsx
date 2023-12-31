import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import SignupPage from "../pages/SignupPage";
import Layout from "../Layout/Layout";
import axios from "axios";
import AccountPage from "../pages/AccountPage";
import EmailVerify from "../common/EmailVerify/EmailVerify";
import UserAccommodationPage from "../pages/UserAccommodationPage";
import ErrorPage from "../pages/ErrorPage";
import UserBookingPage from "../pages/UserBookingPage";

axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
axios.defaults.withCredentials = true;

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route index element={<HomePage />} />
      <Route path="signin" element={<LoginPage />} />
      <Route path="signup" element={<SignupPage />} />
      <Route path="/account/:subpage?" element={<AccountPage />} />
      <Route path="/account/:subpage/:action" element={<AccountPage />} />
      <Route
        path="/account/:subpage/:action/:id"
        element={<UserAccommodationPage />}
      />
      <Route
        path="/account/:subpage/:action/:id/:crud"
        element={<UserAccommodationPage />}
      />
      <Route
        path="/account/bookings/:action/:id"
        element={<UserBookingPage />}
      />
      <Route path="error" element={<ErrorPage />} />
      <Route path="/users/:id/verify/:token" element={<EmailVerify />} />
    </Route>
  )
);

export default router;
