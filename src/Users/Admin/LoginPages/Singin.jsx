import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import {
  clearAdminAuthError,
  loginAdmin,
  logoutAdmin,
} from "../../../redux/slices/adminAuthSlice";

export default function AdminSignIn() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token, loading, error } = useSelector((state) => state.adminAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    dispatch(logoutAdmin());
  }, [dispatch]);

  useEffect(() => {
    dispatch(clearAdminAuthError());

    return () => {
      dispatch(clearAdminAuthError());
    };
  }, [dispatch]);

  useEffect(() => {
    if (token) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [navigate, token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!email || !password) {
      setFormError("Please enter both email and password.");
      return;
    }

    try {
      await dispatch(loginAdmin({ email, password })).unwrap();
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      if (typeof err === "string") {
        setFormError(err);
      } else {
        setFormError("Unable to sign in. Please try again.");
      }
    }
  };

  const displayError = formError || error;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <header className="mb-8 text-center">
          <img
            src="/images/logo-2.jpeg"
            alt="BetterLife Loans"
            className="mx-auto mb-4 h-16 w-16 object-contain"
          />
          <h1 className="text-2xl font-semibold text-slate-900">Admin Console</h1>
          <p className="mt-2 text-sm text-slate-500">
            Sign in with your BetterLife admin credentials to access the dashboard.
          </p>
        </header>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="admin@betterlifeloans.ng"
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-12 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-slate-500 transition hover:text-slate-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {displayError && (
            <p className="text-sm text-rose-600">{displayError}</p>
          )}

          <button
            type="submit"
            className="mt-2 w-full rounded-lg bg-[#1a3a52] px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-[#174061] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* <p className="mt-6 text-center text-sm text-slate-500">
          Need to create an account?{" "}
          <Link
            to="/admin/signup"
            className="font-semibold text-[#1a3a52] transition hover:text-[#174061]"
          >
            Set up admin access
          </Link>
        </p> */}
      </div>
    </div>
  );
}
