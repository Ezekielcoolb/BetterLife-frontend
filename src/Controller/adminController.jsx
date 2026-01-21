import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdminProfile, logoutAdmin } from "../redux/slices/adminAuthSlice";
import AdminSidebar from "../Users/Admin/AdminSidebar";
import AdminNav from "../Users/Admin/AdminNav";

export default function AdminController() {
  const { token, admin, fetchingProfile } = useSelector((state) => state.adminAuth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(() => !token);
  const location = useLocation();

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!token) {
      setIsBootstrapping(false);
      navigate("/admin/signin", { replace: true });
      return () => {};
    }

    const promise = dispatch(fetchAdminProfile());
    promise.finally(() => setIsBootstrapping(false));

    return () => {
      promise.abort?.();
    };
  }, [dispatch, navigate, token]);

  const handleLogout = useMemo(
    () => () => {
      dispatch(logoutAdmin());
      navigate("/admin/signin", { replace: true });
    },
    [dispatch, navigate]
  );

  if (!token && !isBootstrapping) {
    return null;
  }

  if (isBootstrapping || fetchingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-500">Preparing admin workspace...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 md:flex md:overflow-hidden">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} admin={admin} />

      <div className="flex h-screen flex-1 flex-col overflow-hidden">
        <AdminNav
          admin={admin}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
