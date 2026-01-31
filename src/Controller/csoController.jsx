import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import CsoNav from "../Users/CsosPages/CsoNav";
import CsoSidebar from "../Users/CsosPages/csoSidebar";
import { fetchCsoProfile, logoutCso } from "../redux/slices/csoAuthSlice";

export default function CsoController() {
  const { token, cso, profileLoading } = useSelector((state) => state.csoAuth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(() => !token);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!token) {
      setIsBootstrapping(false);
      navigate("/cso/login", { replace: true });
      return () => {};
    }

    const promise = dispatch(fetchCsoProfile());

    promise.finally(() => {
      setIsBootstrapping(false);
    });

    return () => {
      promise.abort?.();
    };
  }, [dispatch, navigate, token]);

  const handleLogout = useMemo(
    () => () => {
      dispatch(logoutCso());
      navigate("/cso/login", { replace: true });
    },
    [dispatch, navigate]
  );

  const handleGoToProfile = useMemo(
    () => () => {
      navigate("/cso/profile");
    },
    [navigate]
  );

  const handleGoToSettings = useMemo(
    () => () => {
      navigate("/cso/settings");
    },
    [navigate]
  );

  if (!token && !isBootstrapping) {
    return null;
  }

  if (isBootstrapping || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-500">Preparing your workspace...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      <CsoSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex h-screen flex-1 flex-col overflow-hidden">
        <CsoNav
          cso={cso}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onNotificationsClick={() => setIsSidebarOpen(true)}
          onProfile={handleGoToProfile}
          onSettings={handleGoToSettings}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto px-3 py-4 pb-20 sm:px-5 lg:px-8">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-1 sm:px-0">
            <Outlet context={{ cso }} />
          </div>
        </main>
      </div>
    </div>
  );
}
