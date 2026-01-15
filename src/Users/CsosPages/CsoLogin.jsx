import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { clearCsoAuthError, loginCso, resetCsoPassword } from "../../redux/slices/csoAuthSlice";

export default function CsoLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isResetMode, setIsResetMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const { token, loading, resettingPassword, error } = useSelector((state) => state.csoAuth);

  useEffect(() => {
    dispatch(clearCsoAuthError());

    return () => {
      dispatch(clearCsoAuthError());
    };
  }, [dispatch]);

  useEffect(() => {
    if (token) {
      navigate("/cso", { replace: true });
    }
  }, [token, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (isResetMode) {
      if (!email || !resetPassword) {
        setFormError("Please provide both email and new password.");
        return;
      }

      if (resetPassword.length < 8) {
        setFormError("New password must be at least 8 characters.");
        return;
      }

      try {
        const message = await dispatch(resetCsoPassword({ email, newPassword: resetPassword })).unwrap();
        setFormSuccess(message || "Password reset successfully. You can now sign in.");
        setResetPassword("");
        setPassword("");
        setIsResetMode(false);
      } catch (err) {
        setFormError(typeof err === "string" ? err : "Unable to reset password.");
      }
      return;
    }

    if (!email || !password) {
      setFormError("Please provide both email and password.");
      return;
    }

    await dispatch(loginCso({ email, password }));
  };

  const displayError = formError || error;
  const isSubmitting = isResetMode ? resettingPassword : loading;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">CSO Portal</h1>
          <p className="mt-2 text-sm text-slate-500">
            {isResetMode ? "Enter your email and a new password to regain access." : "Sign in with your registered CSO email and password."}
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
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="jane.doe@example.com"
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor={isResetMode ? "newPassword" : "password"} className="text-sm font-medium text-slate-700">
              {isResetMode ? "New password" : "Password"}
            </label>
            <div className="relative">
              <input
                id={isResetMode ? "newPassword" : "password"}
                type={isResetMode ? (showResetPassword ? "text" : "password") : showPassword ? "text" : "password"}
                value={isResetMode ? resetPassword : password}
                onChange={(event) =>
                  isResetMode ? setResetPassword(event.target.value) : setPassword(event.target.value)
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder={isResetMode ? "Enter a new password" : "Enter your password"}
                autoComplete={isResetMode ? "new-password" : "current-password"}
              />
              <button
                type="button"
                onClick={() =>
                  isResetMode
                    ? setShowResetPassword((prev) => !prev)
                    : setShowPassword((prev) => !prev)
                }
                className="absolute inset-y-0 right-0 flex items-center px-3 text-indigo-500 hover:text-indigo-600"
                aria-label={
                  isResetMode
                    ? showResetPassword
                      ? "Hide new password"
                      : "Show new password"
                    : showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {isResetMode ? (
                  showResetPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-5 0-9-4-9-8a9.99 9.99 0 0 1 4.9-7.94" />
                      <path d="M1 1l22 22" />
                      <path d="M9.53 9.53A3.5 3.5 0 0 0 12 15.5c.87 0 1.67-.31 2.28-.82" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                    >
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )
                ) : showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-5 0-9-4-9-8a9.99 9.99 0 0 1 4.9-7.94" />
                    <path d="M1 1l22 22" />
                    <path d="M9.53 9.53A3.5 3.5 0 0 0 12 15.5c.87 0 1.67-.31 2.28-.82" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {displayError && <p className="text-sm text-rose-600">{displayError}</p>}
          {formSuccess && <p className="text-sm text-emerald-600">{formSuccess}</p>}

          <button
            type="submit"
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSubmitting}
          >
            {isResetMode ? (isSubmitting ? "Resetting..." : "Reset password") : isSubmitting ? "Signing in..." : "Sign in"}
          </button>

          <div className="text-center text-sm text-slate-600">
            {isResetMode ? "Remembered your password?" : "Forgot your password?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsResetMode((prev) => !prev);
                setFormError("");
                setFormSuccess("");
                setPassword("");
                setResetPassword("");
              }}
              className="font-semibold text-indigo-600 hover:text-indigo-700"
            >
              {isResetMode ? "Sign in instead" : "Reset it"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
